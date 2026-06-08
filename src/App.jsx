import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const MEMBERS = [
  "Agus","Bisca","Boni","Busca","Cabe","Colombo","Furia","Joni","Leche","Leva",
  "Luchi","Mago","Mani","Motalin","Ochoa","Oso","Parra","Porno","Rober",
  "Tingui","Vanar","Zorro",
];

const MEMBER_COLORS = {
  "Parra":"#e03e3e","Boni":"#ad1a72","Furia":"#e9730c","Leche":"#2383e2",
  "Zorro":"#d9730d","Mago":"#0f7b6c","Cabe":"#dfab01","Oso":"#4d6461",
  "Porno":"#c14c8a","Motalin":"#6940a5","Ochoa":"#1d6a8a","Mani":"#2d9596",
  "Agus":"#b0531e","Joni":"#1b6fae","Luchi":"#c76b15","Bisca":"#0d7864",
  "Busca":"#6e4fb5","Colombo":"#1e5f99","Vanar":"#c9820a","Rober":"#b83232",
  "Leva":"#8a2be2", "Tingui":"#5d4037"
};

const MOODS = ["piola","engomado","normal","cansado","caliente"];

const SAMPLE_POSTS = [
  {
    id:"s1", author:"Parra",
    content:"Bienvenidos al Diario LUL. Esto es nuestro espacio para documentar la gloriosa mediocridad del día a día.",
    mood:"piola", media:null,
    timestamp: new Date(Date.now()-1000*60*60*48).toISOString(),
    comments:[
      { id:"c1", author:"Furia", text:"Qué gran iniciativa", media:null, timestamp: new Date(Date.now()-1000*60*60*47).toISOString() },
    ]
  },
  {
    id:"s2", author:"Furia",
    content:"Hoy llegué tarde al laburo por quedarme dormido viendo highlights de mastan hasta las 4am. Sin arrepentimientos.",
    mood:"cansado", media:null,
    timestamp: new Date(Date.now()-1000*60*60*3).toISOString(),
    comments:[]
  },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`;
  if (diff < 86400*7) return `hace ${Math.floor(diff/86400)}d`;
  return new Date(dateStr).toLocaleDateString("es-AR",{day:"numeric",month:"short"});
}

function getColor(name) { return MEMBER_COLORS[name] || "#888"; }

function Avatar({ name, size=28 }) {
  const color = getColor(name);
  return (
    <div style={{
      width:size, height:size, borderRadius:6,
      background:color+"22", border:`1.5px solid ${color}44`,
      color, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.45, fontWeight:700, flexShrink:0,
      fontFamily:"'DM Sans',sans-serif", letterSpacing:"-0.5px",
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

// Convert file to base64 data URL
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Media preview (image or video)
function MediaPreview({ media, onRemove }) {
  if (!media) return null;
  const isVideo = media.type === "video";
  return (
    <div className="media-preview-wrap">
      {isVideo ? (
        <video src={media.url} controls className="media-preview-video" />
      ) : (
        <img src={media.url} alt="adjunto" className="media-preview-img" />
      )}
      {onRemove && (
        <button className="media-remove-btn" onClick={onRemove} title="Quitar">✕</button>
      )}
    </div>
  );
}

// Media display in feed (no remove button)
function MediaDisplay({ media }) {
  if (!media) return null;
  const isVideo = media.type === "video";
  return (
    <div className="media-display-wrap">
      {isVideo ? (
        <video src={media.url} controls className="media-display-video" />
      ) : (
        <img src={media.url} alt="adjunto" className="media-display-img" onClick={e => window.open(media.url)} />
      )}
    </div>
  );
}

// Upload button
function MediaUploadBtn({ onMedia, compact=false }) {
  const ref = useRef(null);
  async function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert("El archivo es muy grande (máx 8MB)"); return; }
    const url = await fileToDataURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    onMedia({ url, type, name: file.name });
    e.target.value = "";
  }
  return (
    <>
      <input ref={ref} type="file" accept="image/*,video/*" style={{display:"none"}} onChange={handle}/>
      <button
        className={compact ? "media-btn-compact" : "media-btn"}
        onClick={() => ref.current?.click()}
        title="Adjuntar imagen o video"
        type="button"
      >
        {compact ? "foto/video" : "＋ foto / video"}
      </button>
    </>
  );
}

// Author picker dropdown
function AuthorPicker({ value, onChange, placeholder="Elegí tu nombre..." }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({});
  const ref = useRef(null);
  
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function handleOpen() {
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 260;
    if (spaceBelow < menuHeight) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width });
    } else {
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  }

  return (
    <div style={{position:"relative"}} ref={ref}>
      <button className="author-btn" onClick={handleOpen} type="button">
        {value
          ? <><Avatar name={value} size={20}/><span style={{color:getColor(value),fontWeight:600,fontSize:14}}>{value}</span></>
          : <span style={{color:"#555",fontSize:14}}>{placeholder}</span>
        }
        <span style={{marginLeft:"auto",fontSize:11,color:"#555",display:"inline-block",transition:"transform .2s",transform:open?"rotate(180deg)":"none"}}>▼</span>
      </button>
      {open && (
        <div className="author-menu" style={{position:"fixed", top:"auto", bottom:"auto", ...menuPos}}>
          {MEMBERS.map(m => (
            <div key={m} className="author-opt" onClick={() => { onChange(m); setOpen(false); }}>
              <div style={{width:7,height:7,borderRadius:2,background:getColor(m),flexShrink:0}}/>
              <span style={{color:getColor(m)}}>{m}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Comment thread component
function CommentThread({ post, onAddComment }) {
  const [open, setOpen] = useState(false);
  const [commenter, setCommenter] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const count = post.comments?.length || 0;

  function toggle() {
    setOpen(o => !o);
    if (!open) setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function submit() {
    if ((!text.trim() && !media) || !commenter) return;
    setSending(true);
    onAddComment(post.id, {
      id: Date.now().toString(), author: commenter,
      text: text.trim(), media: media || null,
      timestamp: new Date().toISOString()
    });
    setText(""); setMedia(null); setSending(false);
  }

  return (
    <div className="comment-section">
      <button className="comment-toggle" onClick={toggle}>
        {count > 0 ? `${count} comentario${count>1?"s":""}` : "comentar"}
        <span style={{marginLeft:5,opacity:.4,fontSize:10}}>{open?"▲":"▼"}</span>
      </button>

      {open && (
        <div className="comment-thread">
          {post.comments?.map(c => (
            <div key={c.id} className="comment-row">
              <Avatar name={c.author} size={22}/>
              <div className="comment-body">
                <span className="comment-author" style={{color:getColor(c.author)}}>{c.author}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
                {c.text && <div className="comment-text">{c.text}</div>}
                {c.media && <MediaDisplay media={c.media}/>}
              </div>
            </div>
          ))}

          <div className="comment-input-row">
            <AuthorPicker value={commenter} onChange={setCommenter} placeholder="vos..."/>
            <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
              {media && <MediaPreview media={media} onRemove={() => setMedia(null)}/>}
              <div className="comment-input-wrap">
                <input
                  ref={inputRef}
                  className="comment-input"
                  placeholder="escribí un comentario..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && !e.shiftKey && submit()}
                  maxLength={4000}
                />
                <MediaUploadBtn onMedia={setMedia} compact={true}/>
                <button
                  className="comment-submit"
                  disabled={(!text.trim()&&!media)||!commenter||sending}
                  onClick={submit}
                >
                  enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────
export default function DiarioLUL() {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("feed");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("normal");
  const [media, setMedia] = useState(null);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
  async function load() {
  const { data, error } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setPosts(SAMPLE_POSTS);
  } else {
    setPosts(data || []);
  }

  setLoaded(true);
}
    load();
  }, []);

  useEffect(() => {
    if (page==="new") setTimeout(() => textareaRef.current?.focus(), 80);
  }, [page]);

  function saveAll(updated) {
  localStorage.setItem(
    "lul-posts-v5",
    JSON.stringify(updated)
    );
  }

  async function submitPost() {
  if ((!content.trim() && !media) || !author) return;

  setSaving(true);

  const { error } = await supabase
    .from("posts")
    .insert({
      author,
      content: content.trim(),
      mood,
      media: media || null,
    });

  if (error) {
    console.error(error);
    alert("Error al guardar la publicación");
    setSaving(false);
    return;
  }

  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  setPosts(data || []);

  setContent("");
  setMood("normal");
  setMedia(null);

  setSaving(false);
  setPage("feed");
}

 async function addComment(postId, comment) {
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author: comment.author,
    text: comment.text,
  });
  if (error) { console.error(error); return; }
  // recargar posts
  const { data } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .order("created_at", { ascending: false });
  setPosts(data || []);
}

  return (
    <div style={{minHeight:"100vh",background:"#191919",color:"#e3e3e3",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:0; }

        .sidebar {
          position:fixed; top:0; left:0; bottom:0; width:240px;
          background:#111; border-right:1px solid #2a2a2a;
          display:flex; flex-direction:column; z-index:10; padding:12px 8px;
        }
        .sidebar-logo { padding:8px 12px 16px; display:flex; align-items:center; gap:10px; }
        .sidebar-logo-badge {
          width:28px; height:28px; background:#e3e3e3; border-radius:6px;
          display:flex; align-items:center; justify-content:center;
          font-size:11px; font-weight:700; color:#111; letter-spacing:-.5px;
        }
        .sidebar-logo-name { font-size:15px; font-weight:600; color:#e3e3e3; letter-spacing:-.3px; }
        .sidebar-nav-item {
          display:flex; align-items:center; gap:8px; padding:6px 12px;
          border-radius:6px; cursor:pointer; font-size:14px; color:#999;
          transition:all .1s; user-select:none;
        }
        .sidebar-nav-item:hover { background:#1e1e1e; color:#e3e3e3; }
        .sidebar-nav-item.active { background:#272727; color:#e3e3e3; }
        .sidebar-divider { height:1px; background:#2a2a2a; margin:8px 12px; }
        .sidebar-section {
          padding:4px 12px 6px; font-size:11px; font-weight:600; color:#555;
          text-transform:uppercase; letter-spacing:.8px; margin-top:8px;
        }
        .members-list { flex:1; overflow-y:auto; padding:4px 0; }
        .member-row {
          display:flex; align-items:center; gap:8px; padding:5px 12px;
          border-radius:6px; font-size:13px; color:#777; transition:background .1s;
        }
        .member-row:hover { background:#1e1e1e; }
        .member-dot { width:7px; height:7px; border-radius:2px; flex-shrink:0; }

        .main { margin-left:240px; min-height:100vh; }
        .topbar {
          position:sticky; top:0; background:rgba(25,25,25,.92);
          backdrop-filter:blur(12px); border-bottom:1px solid #2a2a2a;
          padding:0 40px; height:48px; display:flex; align-items:center;
          justify-content:space-between; z-index:5;
        }
        .breadcrumb { display:flex; align-items:center; gap:5px; font-size:14px; color:#555; }
        .breadcrumb b { color:#ccc; font-weight:500; }
        .new-btn {
          background:#e3e3e3; color:#111; border:none; border-radius:6px;
          padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:background .12s;
        }
        .new-btn:hover { background:#fff; }

        .content { max-width:720px; width:100%; margin:0 auto; padding:48px 40px; }
        .page-title {
          font-family:'DM Serif Display',serif; font-size:38px; font-weight:400;
          color:#e3e3e3; letter-spacing:-1px; line-height:1.15; margin-bottom:4px;
        }
        .page-sub { font-size:13px; color:#555; margin-bottom:36px; }

        /* Posts */
        .post-block { padding:20px 0; border-bottom:1px solid #242424; animation:fadeUp .25s ease; }
        .post-block:first-child { border-top:1px solid #242424; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        .post-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .post-author { font-size:14px; font-weight:600; letter-spacing:-.2px; }
        .post-time { font-size:12px; color:#555; }
        .mood-pill {
          margin-left:auto; padding:3px 10px; border-radius:20px;
          background:#1e1e1e; border:1px solid #2e2e2e; font-size:12px; color:#666;
        }
        .post-body { font-size:15px; line-height:1.7; color:#ccc; margin-bottom:10px; margin-left:38px; }

        /* Media display */
        .media-display-wrap { margin-left:38px; margin-bottom:12px; }
        .media-display-img {
          max-width:100%; max-height:480px; border-radius:8px;
          border:1px solid #2a2a2a; display:block; cursor:zoom-in;
          object-fit:cover;
        }
        .media-display-video {
          max-width:100%; max-height:480px; border-radius:8px;
          border:1px solid #2a2a2a; display:block; background:#000;
        }

        /* Media preview (before upload) */
        .media-preview-wrap {
          position:relative; display:inline-block;
          max-width:100%; margin-bottom:8px;
        }
        .media-preview-img {
          max-width:100%; max-height:260px; border-radius:8px;
          border:1px solid #2a2a2a; display:block; object-fit:cover;
        }
        .media-preview-video {
          max-width:100%; max-height:260px; border-radius:8px;
          border:1px solid #2a2a2a; display:block; background:#000;
        }
        .media-remove-btn {
          position:absolute; top:6px; right:6px;
          background:rgba(0,0,0,.7); color:#ccc; border:none;
          border-radius:50%; width:24px; height:24px; font-size:11px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition:background .12s;
        }
        .media-remove-btn:hover { background:rgba(0,0,0,.9); color:#fff; }

        /* Upload buttons */
        .media-btn {
          background:#1e1e1e; border:1px dashed #383838; color:#666;
          border-radius:6px; padding:8px 14px; font-size:13px; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all .12s; white-space:nowrap;
        }
        .media-btn:hover { border-color:#555; color:#aaa; background:#222; }
        .media-btn-compact {
          background:#1e1e1e; border:1px solid #2e2e2e; color:#666;
          border-radius:6px; padding:7px 10px; font-size:12px; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all .12s; white-space:nowrap;
        }
        .media-btn-compact:hover { border-color:#444; color:#aaa; }

        /* Comments */
        .comment-section { margin-left:38px; }
        .comment-toggle {
          background:none; border:none; cursor:pointer; font-size:12px;
          color:#555; font-family:'DM Sans',sans-serif; padding:4px 0;
          transition:color .12s; display:flex; align-items:center;
        }
        .comment-toggle:hover { color:#999; }
        .comment-thread { margin-top:12px; display:flex; flex-direction:column; gap:12px; animation:fadeUp .2s ease; }
        .comment-row { display:flex; gap:10px; align-items:flex-start; }
        .comment-body { flex:1; }
        .comment-author { font-size:13px; font-weight:600; margin-right:8px; }
        .comment-time { font-size:11px; color:#555; }
        .comment-text { font-size:13px; color:#bbb; margin-top:2px; line-height:1.5; }
        .comment-input-row {
          display:flex; gap:8px; align-items:flex-start;
          padding-top:10px; border-top:1px solid #242424; margin-top:4px;
        }
        .comment-input-wrap { display:flex; gap:6px; flex:1; flex-wrap:wrap; }
        .comment-input {
          flex:1; min-width:120px; background:#1e1e1e; border:1px solid #2e2e2e;
          border-radius:6px; padding:7px 12px; font-size:13px; color:#e3e3e3;
          font-family:'DM Sans',sans-serif; outline:none; transition:border-color .15s;
        }
        .comment-input:focus { border-color:#444; }
        .comment-input::placeholder { color:#3a3a3a; }
        .comment-submit {
          background:#2a2a2a; border:1px solid #383838; color:#aaa;
          border-radius:6px; padding:7px 14px; font-size:12px; font-weight:600;
          cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .12s; white-space:nowrap;
        }
        .comment-submit:hover:not(:disabled) { background:#333; color:#e3e3e3; }
        .comment-submit:disabled { opacity:.3; cursor:not-allowed; }

        /* Author picker */
        .author-btn {
          display:flex; align-items:center; gap:8px; padding:7px 12px;
          background:#1e1e1e; border:1px solid #2e2e2e; border-radius:8px;
          cursor:pointer; width:100%; text-align:left;
          font-family:'DM Sans',sans-serif; transition:border-color .15s;
        }
        .author-btn:hover { border-color:#444; }
        .author-menu {
          position:fixed; 
          background:#1e1e1e; border:1px solid #333; border-radius:8px;
          box-shadow:0 8px 24px rgba(0,0,0,.5); z-index:9999;
          display:flex; flex-direction:column;
          max-height:260px; overflow-y:auto;
          min-width:160px;
}
        .author-opt {
          padding:9px 14px; font-size:13px; font-weight:500;
          cursor:pointer; display:flex; align-items:center; gap:8px; transition:background .1s;
        }
        .author-opt:hover { background:#272727; }

        /* New entry form */
        .new-form { animation:fadeUp .2s ease; }
        .form-field { margin-bottom:22px; }
        .form-label {
          font-size:11px; font-weight:600; text-transform:uppercase;
          letter-spacing:.8px; color:#555; margin-bottom:8px;
        }
        .mood-grid { display:flex; gap:6px; flex-wrap:wrap; }
        .mood-btn {
          padding:6px 14px; border-radius:6px; border:1px solid #2e2e2e;
          background:#1e1e1e; cursor:pointer; font-size:13px; color:#777;
          font-family:'DM Sans',sans-serif; transition:all .12s;
        }
        .mood-btn:hover { border-color:#444; color:#ccc; }
        .mood-btn.sel { border-color:#555; background:#272727; color:#e3e3e3; font-weight:600; }
        .content-area-wrap {
          background:#1e1e1e; border:1px solid #2e2e2e; border-radius:8px;
          padding:14px 16px; transition:border-color .15s;
        }
        .content-area-wrap:focus-within { border-color:#444; }
        .content-area {
          width:100%; background:transparent; border:none; outline:none; resize:none;
          font-size:15px; line-height:1.7; color:#ccc; font-family:'DM Sans',sans-serif;
          min-height:130px; caret-color:#e3e3e3;
        }
        .content-area::placeholder { color:#333; }
        .char-count { font-size:11px; color:#333; text-align:right; margin-top:5px; }
        .form-actions { display:flex; gap:8px; margin-top:6px; align-items:center; flex-wrap:wrap; }
        .btn-primary {
          background:#e3e3e3; color:#111; border:none; border-radius:6px;
          padding:8px 20px; font-size:14px; font-weight:600; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:background .12s;
        }
        .btn-primary:hover:not(:disabled) { background:#fff; }
        .btn-primary:disabled { opacity:.3; cursor:not-allowed; }
        .btn-ghost {
          background:none; border:1px solid #2e2e2e; color:#666; border-radius:6px;
          padding:8px 16px; font-size:14px; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all .12s;
        }
        .btn-ghost:hover { border-color:#444; color:#aaa; }

        .empty { padding:64px 0; text-align:center; color:#3a3a3a; font-size:14px; }
        .empty h3 { font-family:'DM Serif Display',serif; font-size:22px; font-weight:400; color:#444; margin-bottom:6px; }

        @media (max-width:640px) {
          .sidebar { display:none; }
          .main { margin-left:0; }
          .content { padding:28px 20px; }
          .topbar { padding:0 20px; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">LUL</div>
          <div className="sidebar-logo-name">Diario LUL</div>
        </div>
        <div className={`sidebar-nav-item ${page==="feed"?"active":""}`} onClick={() => setPage("feed")}>
          <span style={{fontSize:13}}>≡</span> Feed
        </div>
        <div className={`sidebar-nav-item ${page==="new"?"active":""}`} onClick={() => setPage("new")}>
          <span style={{fontSize:16,fontWeight:300}}>+</span> Nueva entrada
        </div>
        <div className="sidebar-divider"/>
        <div className="sidebar-section">Integrantes</div>
        <div className="members-list">
          {MEMBERS.map(m => (
            <div key={m} className="member-row">
              <div className="member-dot" style={{background:getColor(m)}}/>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb">
            Diario LUL <span style={{margin:"0 4px",color:"#333"}}>›</span>
            <b>{page==="feed" ? "Feed" : "Nueva entrada"}</b>
          </div>
          {page==="feed" && <button className="new-btn" onClick={() => setPage("new")}>+ Nuevo post</button>}
        </div>

        <div className="content">
          {page==="feed" && (
            <>
              <div className="page-title">Diario LUL</div>
              <div className="page-sub">{posts.length} posteo{posts.length!==1?"s":""} · para estar al dia</div>
              {!loaded ? (
                <div className="empty"><p>Cargando...</p></div>
              ) : posts.length===0 ? (
                <div className="empty"><h3>Nada todavía</h3><p>Sé el primero en escribir algo</p></div>
              ) : (
                posts.map(post => (
                  <div className="post-block" key={post.id}>
                    <div className="post-header">
                      <Avatar name={post.author} size={28}/>
                      <span className="post-author" style={{color:getColor(post.author)}}>{post.author}</span>
                      <span className="post-time">{timeAgo(post.created_at)}</span>
                      <div className="mood-pill">{post.mood}</div>
                    </div>
                    {post.content && <div className="post-body">{post.content}</div>}
                    {post.media && <MediaDisplay media={post.media}/>}
                    <CommentThread post={post} onAddComment={addComment}/>
                  </div>
                ))
              )}
            </>
          )}

          {page==="new" && (
            <div className="new-form">
              <div className="page-title" style={{marginBottom:4}}>Nuevo post</div>
              <div className="page-sub" style={{marginBottom:32}}>
                {new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}
              </div>

              <div className="form-field">
                <div className="form-label">Quién sos</div>
                <AuthorPicker value={author} onChange={setAuthor}/>
              </div>

              <div className="form-field">
                <div className="form-label">Cómo estás</div>
                <div className="mood-grid">
                  {MOODS.map(m => (
                    <button key={m} className={`mood-btn ${mood===m?"sel":""}`} onClick={() => setMood(m)}>{m}</button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <div className="form-label">Qué pasó</div>
                <div className="content-area-wrap">
                  <textarea
                    ref={textareaRef}
                    className="content-area"
                    placeholder="Escribí acá..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={10000}
                    rows={5}
                  />
                </div>
                <div className="char-count">{content.length}/10000</div>
              </div>

              <div className="form-field">
                <div className="form-label">Foto o video</div>
                {media
                  ? <MediaPreview media={media} onRemove={() => setMedia(null)}/>
                  : <MediaUploadBtn onMedia={setMedia}/>
                }
              </div>

              <div className="form-actions">
                <button className="btn-primary" disabled={(!content.trim()&&!media)||!author||saving} onClick={submitPost}>
                  {saving ? "Guardando..." : "Publicar entrada"}
                </button>
                <button className="btn-ghost" onClick={() => setPage("feed")}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
