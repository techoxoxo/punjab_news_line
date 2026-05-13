#!/usr/bin/env python3
"""MSSQL -> PostgreSQL data migration utility.

Usage:
  python migration/migrate_data.py

Environment variables:
  MSSQL_DSN (optional): full pyodbc connection string
  MSSQL_SERVER (default: localhost,1433)
  MSSQL_DATABASE (default: punjabnewsline)
  MSSQL_USER (default: sa)
  MSSQL_PASSWORD (default: Anuj@123)

  PG_DSN (optional): full psycopg2 connection string
  PG_HOST (default: localhost)
  PG_PORT (default: 5432)
  PG_DATABASE (default: punjabnewsline)
  PG_USER (default: postgres)
  PG_PASSWORD (default: Anuj@123)

  MIGRATE_TRUNCATE_FIRST (default: 0): set 1 to truncate target tables first
  MIGRATE_BATCH_SIZE (default: 1000)
"""

from __future__ import annotations

import os
import sys
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Iterable, List, Sequence, Tuple

import pyodbc
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values


TABLE_MAP: List[Tuple[str, str]] = [
    ("OXARTICLE", "ox_article"),
    ("OXVIDEO", "ox_video"),
    ("OXGALLERY", "ox_gallery"),
    ("OXPOLL", "ox_poll"),
    ("OXPOLLX", "ox_pollx"),
    ("OXCODE", "ox_code"),
    ("OXACATEGORY", "ox_acategory"),
    ("OXCCATEGORY", "ox_ccategory"),
    ("OXTEAM", "ox_team"),
    ("OXCOMMENT", "ox_comment"),
    ("OXMEMBER", "ox_member"),
    ("OXADVT", "ox_advt"),
    ("OXCLASSIFIED", "ox_classified"),
    ("OXFILE", "ox_file"),
    ("OXFEEDBACK", "ox_feedback"),
    ("OXPROFILE", "ox_profile"),
    ("OXMULTIPHOTO", "ox_multiphoto"),
    ("OXRESPONSE", "ox_response"),
    ("OXSUBMIT", "ox_submit"),
    ("OXUSER", "ox_user"),
    ("OXRIGHT", "ox_right"),
    ("OXTITLE", "ox_title"),
    ("OXCOUNTER", "ox_counter"),
]


COLUMN_OVERRIDE: dict[str, dict[str, str]] = {
    "ox_code": {
        "cgry_code": "oxcode",
        "cgry_name": "oxname",
        "cgry_order": "sorting",
    },
    "ox_acategory": {
        "acgr_code": "cgrycode",
        "acgr_name": "cgryname",
    },
    "ox_ccategory": {
        "ccgr_code": "cgrycode",
        "ccgr_name": "cgryname",
        "sgmt_code": "itype",
    },
    "ox_gallery": {
        "gallery_code": "photocode",
        "gallery_head": "photohead",
        "gallery_desc": "photodesc",
    },
    "ox_article": {
        "vlink": "videoscript",
    },
    "ox_video": {
        "vlink": "videoscript",
    },
    "ox_multiphoto": {
        "photo_code": "photocode",
    }
}


def mssql_dsn() -> str:
    explicit = os.getenv("MSSQL_DSN")
    if explicit:
        return explicit
    server = os.getenv("MSSQL_SERVER", "localhost,1433")
    database = os.getenv("MSSQL_DATABASE", "punjabnewsline")
    user = os.getenv("MSSQL_USER", "sa")
    password = os.getenv("MSSQL_PASSWORD", "Anuj@123")
    return (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={user};"
        f"PWD={password};"
        "TrustServerCertificate=yes;"
    )


def pg_dsn() -> str:
    explicit = os.getenv("PG_DSN")
    if explicit:
        return explicit
    host = os.getenv("PG_HOST", "localhost")
    port = os.getenv("PG_PORT", "5432")
    database = os.getenv("PG_DATABASE", "punjabnewsline")
    user = os.getenv("PG_USER", "postgres")
    password = os.getenv("PG_PASSWORD", "Anuj@123")
    return f"host={host} port={port} dbname={database} user={user} password={password}"


def normalize_value(value: Any) -> Any:
    # pyodbc can return naive datetime/date/time objects and Decimals; psycopg2 handles those directly.
    if isinstance(value, (datetime, date, time, Decimal)):
        return value
    return value


def normalize_row(row: Sequence[Any]) -> Tuple[Any, ...]:
    return tuple(normalize_value(v) for v in row)


def fetch_source_columns(cur: pyodbc.Cursor, table: str) -> List[str]:
    rows = cur.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=? ORDER BY ORDINAL_POSITION",
        table,
    ).fetchall()
    return [r[0] for r in rows]


def fetch_target_columns(cur: psycopg2.extensions.cursor, table: str) -> List[str]:
    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position
        """,
        (table,),
    )
    return [r[0] for r in cur.fetchall()]


def common_columns_map(source_cols: Iterable[str], target_cols: Iterable[str], table_name: str) -> List[Tuple[str, str]]:
    """Returns a list of (mssql_col, pg_col) for matched columns."""
    source_clean = {c.replace("_", "").lower(): c for c in source_cols}
    overrides = COLUMN_OVERRIDE.get(table_name, {})
    matches = []
    for t in target_cols:
        t_low = t.lower()
        if t_low in overrides:
            mssql_target = overrides[t_low]
            if mssql_target in source_clean:
                matches.append((source_clean[mssql_target], t))
                continue

        t_clean = t.replace("_", "").lower()
        if t_clean in source_clean:
            matches.append((source_clean[t_clean], t))
    return matches


CONFLICT_STRATEGY: dict[str, str] = {
    "ox_article": "ON CONFLICT (article_code) DO UPDATE SET permalink = EXCLUDED.permalink || '-' || EXCLUDED.article_code WHERE ox_article.permalink = EXCLUDED.permalink",
    "ox_video": "ON CONFLICT (video_code) DO UPDATE SET permalink = EXCLUDED.permalink || '-' || EXCLUDED.video_code WHERE ox_video.permalink = EXCLUDED.permalink",
    "ox_gallery": "ON CONFLICT (gallery_code) DO NOTHING",
    "ox_poll": "ON CONFLICT (poll_code) DO NOTHING",
    "ox_pollx": "ON CONFLICT (pllx_code) DO NOTHING",
    "ox_code": "ON CONFLICT (cgry_code) DO NOTHING",
    "ox_acategory": "ON CONFLICT (acgr_code) DO NOTHING",
    "ox_ccategory": "ON CONFLICT (ccgr_code) DO NOTHING",
    "ox_team": "ON CONFLICT (team_code) DO NOTHING",
    "ox_member": "ON CONFLICT (member_code) DO NOTHING",
    "ox_advt": "ON CONFLICT (advt_code) DO NOTHING",
    "ox_classified": "ON CONFLICT (classified_code) DO NOTHING",
    "ox_user": "ON CONFLICT (user_code) DO NOTHING",
}


def migrate_table(
    ms_cur: pyodbc.Cursor,
    pg_cur: psycopg2.extensions.cursor,
    src_table: str,
    dst_table: str,
    batch_size: int,
    truncate_first: bool,
) -> int:
    src_cols_all = fetch_source_columns(ms_cur, src_table)
    dst_cols_all = fetch_target_columns(pg_cur, dst_table)
    
    col_map = common_columns_map(src_cols_all, dst_cols_all, dst_table)
    
    if not col_map:
        print(f"  ! skipped {src_table} -> {dst_table}: no shared columns")
        return 0

    ms_cols = [m for m, p in col_map]
    pg_cols = [p for m, p in col_map]

    quoted_pg_cols = sql.SQL(", ").join(sql.Identifier(c) for c in pg_cols)

    if truncate_first:
        pg_cur.execute(sql.SQL("TRUNCATE TABLE {} RESTART IDENTITY CASCADE").format(sql.Identifier(dst_table)))

    # Use square brackets for MSSQL identifiers to handle reserved words
    select_q = f"SELECT {', '.join('[' + c + ']' for c in ms_cols)} FROM [{src_table}]"
    ms_cur.execute(select_q)

    inserted = 0
    conflict = CONFLICT_STRATEGY.get(dst_table, "")
    insert_stmt = sql.SQL("INSERT INTO {} ({}) VALUES %s {}").format(
        sql.Identifier(dst_table), 
        quoted_pg_cols,
        sql.SQL(conflict)
    )

    while True:
        batch = ms_cur.fetchmany(batch_size)
        if not batch:
            break
        payload = [normalize_row(row) for row in batch]
        execute_values(pg_cur, insert_stmt.as_string(pg_cur), payload, page_size=batch_size)
        inserted += len(payload)

    return inserted


def table_exists_in_mssql(cur: pyodbc.Cursor, table: str) -> bool:
    row = cur.execute(
        "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME=?",
        table,
    ).fetchone()
    return row is not None


def table_exists_in_pg(cur: psycopg2.extensions.cursor, table: str) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table,),
    )
    return cur.fetchone() is not None


def main() -> int:
    batch_size = int(os.getenv("MIGRATE_BATCH_SIZE", "1000"))
    truncate_first = os.getenv("MIGRATE_TRUNCATE_FIRST", "0") == "1"

    print("Connecting to MSSQL...")
    ms_conn = pyodbc.connect(mssql_dsn())
    ms_cur = ms_conn.cursor()

    print("Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(pg_dsn())
    pg_conn.autocommit = False
    pg_cur = pg_conn.cursor()

    # Disable foreign key checks for the session to handle orphaned records
    pg_cur.execute("SET session_replication_role = 'replica';")

    total_inserted = 0
    try:
        for src, dst in TABLE_MAP:
            print(f"Migrating {src} -> {dst}")

            if not table_exists_in_mssql(ms_cur, src):
                print(f"  ! source table missing: {src}")
                continue
            if not table_exists_in_pg(pg_cur, dst):
                print(f"  ! target table missing: {dst}")
                continue

            inserted = migrate_table(ms_cur, pg_cur, src, dst, batch_size, truncate_first)
            pg_conn.commit()
            total_inserted += inserted
            print(f"  + inserted rows: {inserted}")

        print(f"Done. Total inserted rows: {total_inserted}")
        return 0
    except Exception as exc:  # pylint: disable=broad-except
        pg_conn.rollback()
        print(f"Migration failed: {exc}", file=sys.stderr)
        return 1
    finally:
        try:
            pg_cur.close()
            pg_conn.close()
        except Exception:
            pass
        try:
            ms_cur.close()
            ms_conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
