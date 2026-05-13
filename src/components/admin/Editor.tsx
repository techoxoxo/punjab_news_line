import React from 'react'
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { Node } from '@tiptap/core'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Video as VideoIcon,
  Link as LinkIcon,
  Unlink,
  Maximize2,
  Plus,
  Upload,
  Share2,
  Code
} from 'lucide-react'

// Custom Figure extension to support captions
const Figure = Image.extend({
  name: 'figure',
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: element => element.querySelector('figcaption')?.innerText,
      }
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { caption, ...imgAttributes } = HTMLAttributes
    return [
      'figure', 
      { class: 'article-figure' }, 
      ['img', imgAttributes],
      ['figcaption', { class: 'article-caption' }, caption || '']
    ]
  },
})

// Custom Social Embed extension
const SocialPostView = ({ node }: { node: any }) => {
  const { url, type } = node.attrs
  
  if (type === 'instagram') {
    const embedUrl = url.endsWith('/') ? `${url}embed` : `${url}/embed`
    return (
      <NodeViewWrapper className="social-post-preview my-8">
        <div className="relative rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Share2 className="h-3 w-3" /> Instagram Preview
            </span>
          </div>
          <iframe 
            src={embedUrl} 
            className="w-full h-[500px] border-0" 
            scrolling="no" 
            allowTransparency={true}
          />
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="social-post-preview my-8">
      <div className="p-6 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-center">
        <Share2 className="h-5 w-5 text-brand" />
        <div>
          <p className="font-bold text-sm text-slate-700">{type === 'twitter' ? 'X (Twitter)' : 'Social'} Post</p>
          <p className="text-[10px] text-slate-500 truncate max-w-xs">{url}</p>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const SocialPost = Node.create({
  name: 'socialPost',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      url: {
        default: null,
      },
      type: {
        default: 'twitter', 
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(SocialPostView)
  },
  parseHTML() {
    return [
      {
        tag: 'blockquote.twitter-tweet',
        getAttrs: (element) => {
          const el = element as HTMLElement
          // Find the link that contains '/status/' which is the actual tweet URL
          const statusLink = Array.from(el.querySelectorAll('a')).find(a => a.href.includes('/status/'))
          return {
            url: statusLink?.getAttribute('href'),
            type: 'twitter',
          }
        },
      },
      {
        tag: 'blockquote.instagram-media',
        getAttrs: (element) => {
          const el = element as HTMLElement
          // Look for data-instgrm-permalink or the status link
          const url = el.getAttribute('data-instgrm-permalink') || 
                      Array.from(el.querySelectorAll('a')).find(a => a.href.includes('instagram.com/p/'))?.getAttribute('href')
          return {
            url,
            type: 'instagram',
          }
        },
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.type === 'twitter') {
      return [
        'blockquote', 
        { 
          class: 'twitter-tweet', 
          'data-lang': 'en',
          'data-dnt': 'true',
          'data-theme': 'light' 
        }, 
        ['a', { href: HTMLAttributes.url }, 'View Tweet on X']
      ]
    }
    if (HTMLAttributes.type === 'instagram') {
      return [
        'blockquote', 
        { 
          class: 'instagram-media', 
          'data-instgrm-permalink': HTMLAttributes.url,
          'data-instgrm-version': '14',
          style: 'background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);'
        }, 
        ['a', { href: HTMLAttributes.url }, 'View Post on Instagram']
      ]
    }
    return ['div', { class: 'social-embed-fallback' }, 'Social Embed: ' + HTMLAttributes.url]
  },
})

// Raw Embed Code extension
const EmbedCode = Node.create({
  name: 'embedCode',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      code: {
        default: '',
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-type="custom-embed"]',
        getAttrs: element => ({
          code: (element as HTMLElement).getAttribute('data-code'),
        }),
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'custom-embed', 'data-code': HTMLAttributes.code }, 'Custom Embed Code']
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => (
      <NodeViewWrapper className="custom-embed-preview my-8">
        <div className="p-4 rounded-[1.5rem] border-2 border-brand/20 bg-brand/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2">
              <Code className="h-3 w-3" /> Custom Embed Code
            </span>
          </div>
          <pre className="text-[10px] text-slate-500 bg-white p-3 rounded-lg overflow-x-auto max-h-[100px] border border-brand/10">
            {node.attrs.code}
          </pre>
          <p className="text-[10px] text-slate-400 mt-2 italic text-center">This code will render directly on the live site</p>
        </div>
      </NodeViewWrapper>
    ))
  },
})

interface EditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  if (!editor) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const caption = window.prompt('Enter image caption (optional)')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', `inline-${Date.now()}.jpg`)
    formData.append('folder', 'news/inline')

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        editor.chain().focus().setImage({ 
          src: data.publicUrl, 
          alt: caption || '', 
          title: caption || '',
          // @ts-ignore
          caption: caption || '' 
        }).run()
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Failed to upload image')
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    const caption = window.prompt('Enter image caption (optional)')
    if (url) {
      editor.chain().focus().setImage({ 
        src: url, 
        alt: caption || '', 
        title: caption || '',
        // @ts-ignore
        caption: caption || ''
      }).run()
    }
  }

  const addYoutubeVideo = () => {
    const url = window.prompt('Enter YouTube URL')
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      })
    }
  }

  const addSocialEmbed = () => {
    const url = window.prompt('Enter X/Twitter or Instagram URL')
    if (!url) return

    let type = 'twitter'
    if (url.includes('instagram.com')) {
      type = 'instagram'
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      type = 'twitter'
    } else {
      alert('Only X/Twitter and Instagram links are supported for rich embeds.')
      return
    }

    editor.chain().focus().insertContent({
      type: 'socialPost',
      attrs: { url, type }
    }).run()
  }

  const addCustomEmbed = () => {
    const code = window.prompt('Paste your embed code (HTML) here:')
    if (code) {
      editor.chain().focus().insertContent({
        type: 'embedCode',
        attrs: { code }
      }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-white border-b border-slate-100 sticky top-0 z-10 rounded-t-[1.5rem]">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload} 
      />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-px h-8 bg-slate-100 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <div className="w-px h-8 bg-slate-100 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('orderedList') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg transition-all ${editor.isActive('blockquote') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </button>
      <div className="w-px h-8 bg-slate-100 mx-1" />
      
      {/* Link Controls */}
      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded-lg transition-all ${editor.isActive('link') ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-slate-50 hover:text-brand'}`}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all disabled:opacity-20"
        title="Remove Link"
      >
        <Unlink className="h-4 w-4" />
      </button>

      <div className="w-px h-8 bg-slate-100 mx-1" />

      {/* Media Controls */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all"
        title="Upload Image"
      >
        <Upload className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all"
        title="Insert Image by URL"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addYoutubeVideo}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all"
        title="Insert YouTube Video"
      >
        <VideoIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addSocialEmbed}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all"
        title="Embed X (Twitter) or Instagram Post"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addCustomEmbed}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all"
        title="Paste Raw Embed Code (HTML)"
      >
        <Code className="h-4 w-4" />
      </button>

      <div className="ml-auto flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all disabled:opacity-20"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand transition-all disabled:opacity-20"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function Editor({ value, onChange, placeholder }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Figure.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-[2rem] shadow-premium border border-slate-100 max-w-full h-auto mt-8',
        },
      }),
      SocialPost,
      EmbedCode,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand underline decoration-brand/30 underline-offset-4 font-bold',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'rounded-[2rem] overflow-hidden shadow-premium my-12 w-full aspect-video',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your news story...',
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] p-8 md:p-12 text-lg font-medium text-slate-700 leading-relaxed',
      },
    },
  })

  // Sync content if value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className="tiptap-editor-wrapper bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <style jsx global>{`
        .tiptap-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #cbd5e1;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor-wrapper .ProseMirror {
          min-height: 600px;
        }
        .tiptap-editor-wrapper .ProseMirror:focus {
          background: white;
        }
        .tiptap-editor-wrapper .ProseMirror img {
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        .tiptap-editor-wrapper .ProseMirror blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1.5rem 0;
          color: #64748b;
          font-style: italic;
        }
        .tiptap-editor-wrapper .ProseMirror .social-post-preview {
          user-select: none;
        }
        .tiptap-editor-wrapper .ProseMirror .custom-embed-preview pre {
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  )
}
