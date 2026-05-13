#!/usr/bin/env python3
"""Standalone script to update vlink from VIDEOSCRIPT for existing records.
Useful when Phase 1 migration is already done but vlink was missed.
"""

import os
import pyodbc
import psycopg2
from psycopg2 import sql

def mssql_dsn():
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

def pg_dsn():
    host = os.getenv("PG_HOST", "localhost")
    port = os.getenv("PG_PORT", "5432")
    database = os.getenv("PG_DATABASE", "punjabnewsline")
    user = os.getenv("PG_USER", "postgres")
    password = os.getenv("PG_PASSWORD", "Anuj@123")
    return f"host={host} port={port} dbname={database} user={user} password={password}"

def update_vlinks():
    print("Connecting to MSSQL...")
    try:
        ms_conn = pyodbc.connect(mssql_dsn())
        ms_cur = ms_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to MSSQL: {e}")
        return

    print("Connecting to PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(pg_dsn())
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to PG: {e}")
        return

    tables = [
        ("OXVIDEO", "ox_video", "VIDEOCODE", "video_code"),
        ("OXARTICLE", "ox_article", "ARTICLECODE", "article_code")
    ]

    for ms_table, pg_table, ms_id, pg_id in tables:
        print(f"Updating {pg_table} from {ms_table}...")
        
        # Fetch all VIDEOSCRIPT values from MSSQL
        ms_cur.execute(f"SELECT [{ms_id}], [VIDEOSCRIPT] FROM [{ms_table}] WHERE [VIDEOSCRIPT] IS NOT NULL AND [VIDEOSCRIPT] != ''")
        rows = ms_cur.fetchall()
        print(f"  Found {len(rows)} records with VIDEOSCRIPT in {ms_table}")

        updated = 0
        for code, script in rows:
            if not script:
                continue
            
            # Simple extraction if it's an iframe (fallback for weird data)
            # but usually it's just the 11 char ID
            script = script.strip()
            
            pg_cur.execute(
                sql.SQL("UPDATE {} SET vlink = %s WHERE {} = %s").format(
                    sql.Identifier(pg_table),
                    sql.Identifier(pg_id)
                ),
                (script, code)
            )
            updated += 1
            if updated % 100 == 0:
                pg_conn.commit()
                print(f"  Processed {updated} records...")

        pg_conn.commit()
        print(f"  Successfully updated {updated} records in {pg_table}")

    ms_cur.close()
    ms_conn.close()
    pg_cur.close()
    pg_conn.close()
    print("Done.")

if __name__ == "__main__":
    update_vlinks()
