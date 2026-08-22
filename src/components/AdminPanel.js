"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { SUBJECTS } from "../utils/subjects";
import { getSupabaseBrowserClient } from "../utils/supabase";

const EMPTY_FORM = {
  slug: "",
  title: "",
  description: "",
  subject: SUBJECTS[0].id,
  materia: SUBJECTS[0].name,
  ano_letivo: "",
  exercise_date: new Date().toISOString().slice(0, 10),
  published: true,
  exercises: "[]",
};

const SUMMARY_COLUMNS = "id, slug, title, subject, materia, ano_letivo, exercise_date, question_count, published, updated_at";

function formatDate(value) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-2xl border-2 border-lilac/15 bg-white/80 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lilac focus:ring-4 focus:ring-lilac/10";

function LoginForm({ onLogin, isSubmitting, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin(email, password);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-12">
      <div className="clay bg-white/80 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">🛠️</div>
          <h1 className="font-display text-2xl font-bold text-ink">Painel da Esther</h1>
          <p className="mt-2 text-sm text-ink-soft">Entre com sua conta de administrador para gerenciar as listas.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label="Senha">
            <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          {error && <p className="rounded-2xl bg-candy-soft px-3 py-2 text-sm font-semibold text-[#a62f5f]">{error}</p>}
          <button className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-lilac px-4 py-3 font-display font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting}>
            <LogIn className="h-5 w-5" /> {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ListForm({ form, editingId, onChange, onSave, onCancel, isSaving, error }) {
  const selectedSubject = SUBJECTS.find((subject) => subject.id === form.subject) ?? SUBJECTS[0];

  function updateField(field, value) {
    onChange({ ...form, [field]: value });
  }

  function handleSubjectChange(event) {
    const subject = SUBJECTS.find((item) => item.id === event.target.value) ?? SUBJECTS[0];
    onChange({ ...form, subject: subject.id, materia: subject.name });
  }

  function generateSlug() {
    updateField("slug", slugify(form.title));
  }

  return (
    <form className="clay bg-white/75 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-lilac">{editingId ? "Editar lista" : "Nova lista"}</p>
          <h2 className="font-display text-2xl font-bold text-ink">Dados da lista</h2>
        </div>
        {editingId && (
          <button type="button" className="press rounded-full bg-white p-2 text-ink-soft shadow-sm hover:text-ink" onClick={onCancel} aria-label="Cancelar edição">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" className="sm:col-span-2">
          <input className={inputClass} value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
        </Field>
        <Field label="Slug / identificador">
          <div className="flex gap-2">
            <input className={inputClass} value={form.slug} onChange={(event) => updateField("slug", event.target.value)} pattern="[a-z0-9][a-z0-9_-]*" required />
            <button type="button" className="shrink-0 rounded-2xl bg-sky-soft px-3 text-xs font-bold text-[#1e7fa6]" onClick={generateSlug}>Gerar</button>
          </div>
        </Field>
        <Field label="Matéria">
          <select className={inputClass} value={form.subject} onChange={handleSubjectChange}>
            {SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </Field>
        <Field label="Ano letivo">
          <input className={inputClass} value={form.ano_letivo} onChange={(event) => updateField("ano_letivo", event.target.value)} placeholder="3º ano do Ensino Fundamental" />
        </Field>
        <Field label="Data">
          <input className={inputClass} type="date" value={form.exercise_date} onChange={(event) => updateField("exercise_date", event.target.value)} required />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <textarea className={`${inputClass} min-h-24 resize-y`} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </Field>
        <Field label="Exercícios (JSON)" className="sm:col-span-2">
          <textarea className={`${inputClass} min-h-[26rem] resize-y font-mono text-xs`} value={form.exercises} onChange={(event) => updateField("exercises", event.target.value)} spellCheck="false" required />
          <p className="mt-1.5 text-xs text-ink-soft">Use os tipos <code>multiple-choice</code>, <code>fill-gap</code> e <code>true-false</code>, mantendo <code>options</code> e <code>correctIndex</code>.</p>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-lilac/10 pt-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={form.published} onChange={(event) => updateField("published", event.target.checked)} className="h-4 w-4 accent-lilac" />
          Publicada no site
        </label>
        <div className="flex gap-2">
          {editingId && <button type="button" className="press rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-ink-soft shadow-sm" onClick={onCancel}>Cancelar</button>}
          <button className="press flex items-center gap-2 rounded-2xl bg-mint px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60" disabled={isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar lista"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 rounded-2xl bg-candy-soft px-3 py-2 text-sm font-semibold text-[#a62f5f]">{error}</p>}
      <p className="mt-3 text-xs text-ink-soft">Tema visual: {selectedSubject.emoji} {selectedSubject.name}. A contagem de questões é calculada pelo banco.</p>
    </form>
  );
}

function AdminWorkspace({ user, onLogout }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [lists, setLists] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const loadLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("exercise_lists")
      .select(SUMMARY_COLUMNS)
      .order("exercise_date", { ascending: false })
      .order("updated_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setLists(data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  function startNew() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, exercise_date: new Date().toISOString().slice(0, 10) });
    setFormError(null);
  }

  async function editList(id) {
    setFormError(null);
    const { data, error: queryError } = await supabase.from("exercise_lists").select("*").eq("id", id).single();
    if (queryError) {
      setFormError(queryError.message);
      return;
    }
    setEditingId(id);
    setForm({
      slug: data.slug,
      title: data.title,
      description: data.description ?? "",
      subject: data.subject,
      materia: data.materia,
      ano_letivo: data.ano_letivo ?? "",
      exercise_date: data.exercise_date,
      published: data.published,
      exercises: JSON.stringify(data.exercises ?? [], null, 2),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveList() {
    setFormError(null);
    let exercises;
    try {
      exercises = JSON.parse(form.exercises);
      if (!Array.isArray(exercises)) throw new Error("O JSON precisa conter uma lista de exercícios.");
    } catch (parseError) {
      setFormError(`JSON inválido: ${parseError.message}`);
      return;
    }

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject: form.subject,
      materia: form.materia,
      ano_letivo: form.ano_letivo.trim() || null,
      exercise_date: form.exercise_date,
      published: form.published,
      exercises,
    };

    setIsSaving(true);
    const query = editingId
      ? supabase.from("exercise_lists").update(payload).eq("id", editingId)
      : supabase.from("exercise_lists").insert(payload);
    const { error: saveError } = await query;
    setIsSaving(false);

    if (saveError) {
      setFormError(saveError.message.includes("duplicate") ? "Este slug já existe nesta matéria." : saveError.message);
      return;
    }

    startNew();
    await loadLists();
  }

  async function deleteList(list) {
    if (!window.confirm(`Excluir a lista “${list.title}”? Essa ação não pode ser desfeita.`)) return;
    const { error: deleteError } = await supabase.from("exercise_lists").delete().eq("id", list.id);
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === list.id) startNew();
      await loadLists();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-lilac">Administração</p>
          <h1 className="font-display text-3xl font-bold text-ink">Listas de exercícios</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button className="press flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-ink shadow-sm" onClick={loadLists} disabled={isLoading}><RefreshCw className="h-4 w-4" /> Atualizar</button>
          <button className="press flex items-center gap-2 rounded-2xl bg-candy px-3 py-2 text-sm font-bold text-white shadow-sm" onClick={onLogout}><LogOut className="h-4 w-4" /> Sair</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section className="order-2 lg:order-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Cadastradas ({lists.length})</h2>
            <button className="press flex items-center gap-2 rounded-2xl bg-lilac px-3 py-2 text-sm font-bold text-white shadow-sm" onClick={startNew}><Plus className="h-4 w-4" /> Nova</button>
          </div>
          {error && <p className="mb-3 rounded-2xl bg-candy-soft px-3 py-2 text-sm font-semibold text-[#a62f5f]">{error}</p>}
          {isLoading ? <div className="clay bg-white/70 p-8 text-center text-ink-soft">Carregando listas...</div> : (
            <div className="space-y-3">
              {lists.map((list) => (
                <article key={list.id} className="clay bg-white/75 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-bold text-ink">{list.title}</h3>
                      <p className="mt-1 text-xs text-ink-soft">{list.materia} · {formatDate(list.exercise_date)} · {list.question_count} questões</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${list.published ? "bg-mint/15 text-[#078d6d]" : "bg-ink/10 text-ink-soft"}`}>{list.published ? "Publicada" : "Rascunho"}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="press flex items-center gap-1.5 rounded-xl bg-sky-soft px-3 py-2 text-xs font-bold text-[#1e7fa6]" onClick={() => editList(list.id)}><Pencil className="h-3.5 w-3.5" /> Editar</button>
                    <button className="press flex items-center gap-1.5 rounded-xl bg-candy-soft px-3 py-2 text-xs font-bold text-[#a62f5f]" onClick={() => deleteList(list)}><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="order-1 lg:order-2">
          <ListForm form={form} editingId={editingId} onChange={setForm} onSave={saveList} onCancel={startNew} isSaving={isSaving} error={formError} />
        </section>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) {
      setIsReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    let mounted = true;
    async function verifyAdmin() {
      const { data: membership, error: membershipError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (membershipError) {
        if (mounted) setError(membershipError.message);
        return;
      }
      if (membership) {
        if (mounted) setIsAdmin(true);
        return;
      }

      const { data: claimed, error: claimError } = await supabase.rpc("claim_first_admin");
      if (claimError) {
        if (mounted) setError(claimError.message);
      } else if (mounted) {
        setIsAdmin(claimed === true);
        if (claimed !== true) setError("Esta conta não tem permissão de administrador.");
      }
    }
    verifyAdmin();
    return () => { mounted = false; };
  }, [session, supabase]);

  async function handleLogin(email, password) {
    setIsSubmitting(true);
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setIsSubmitting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }

  if (!isReady) return <div className="flex min-h-[60vh] items-center justify-center text-ink-soft">Carregando painel...</div>;
  if (!supabase) return <div className="mx-auto max-w-md px-4 pb-16 pt-12"><div className="clay bg-candy-soft p-6 text-center"><div className="mb-2 text-4xl">⚙️</div><h1 className="font-display text-xl font-bold text-[#a62f5f]">Supabase não configurado</h1><p className="mt-2 text-sm text-ink-soft">As variáveis de ambiente do Supabase não foram definidas. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p></div></div>;
  if (!session) return <LoginForm onLogin={handleLogin} isSubmitting={isSubmitting} error={error} />;
  if (!isAdmin) return <div className="mx-auto max-w-md px-4 pb-16 pt-12"><div className="clay bg-candy-soft p-6 text-center"><div className="mb-2 text-4xl">🔒</div><h1 className="font-display text-xl font-bold text-[#a62f5f]">Acesso restrito</h1><p className="mt-2 text-sm text-ink-soft">{error ?? "Verificando permissões..."}</p><button className="press mt-5 rounded-2xl bg-white px-4 py-2 font-bold text-ink shadow-sm" onClick={handleLogout}>Sair</button></div></div>;
  return <AdminWorkspace user={session.user} onLogout={handleLogout} />;
}
