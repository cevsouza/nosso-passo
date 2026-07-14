"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { firebaseBridge } from '@/lib/firebase-bridge';
import { KeyRound, Copy, Check, Trash2, Plus } from 'lucide-react';

type Loc = 'pt' | 'en' | 'es';

const roleInfo = (locale: Loc) => ({
  therapist: {
    label: locale === 'en' ? 'Therapist' : locale === 'es' ? 'Terapeuta' : 'Terapeuta',
    hint: locale === 'en' ? 'Read + edit routine and clinical notes' : locale === 'es' ? 'Lee + edita rutina y notas' : 'Lê + edita rotina e notas clínicas',
  },
  school: {
    label: locale === 'en' ? 'School' : locale === 'es' ? 'Escuela' : 'Escola',
    hint: locale === 'en' ? 'Read routine + log sensory (no edits)' : locale === 'es' ? 'Lee rutina + registra sensorial' : 'Lê rotina + registra sensorial (sem editar)',
  },
  readonly: {
    label: locale === 'en' ? 'Read-only' : locale === 'es' ? 'Solo lectura' : 'Somente leitura',
    hint: locale === 'en' ? 'View only, no changes' : locale === 'es' ? 'Solo ver, sin cambios' : 'Só visualizar, sem alterar',
  },
});

function statusOf(c: any, locale: Loc) {
  if (c.revoked) return { text: locale === 'en' ? 'Revoked' : locale === 'es' ? 'Revocado' : 'Revogado', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { text: locale === 'en' ? 'Expired' : locale === 'es' ? 'Expirado' : 'Expirado', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { text: locale === 'en' ? 'Active' : locale === 'es' ? 'Activo' : 'Ativo', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export function AccessCodesManager({ childId, locale }: { childId?: string; locale: Loc }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('therapist');
  const [label, setLabel] = useState('');
  const [expiry, setExpiry] = useState('90');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState('');

  const roles = roleInfo(locale);

  const load = useCallback(async () => {
    if (!childId) { setCodes([]); return; }
    setLoading(true); setError('');
    try { setCodes(await firebaseBridge.auth.listAccessCodes(childId)); }
    catch (e: any) { setError(e.message || 'Erro ao carregar códigos.'); }
    finally { setLoading(false); }
  }, [childId]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!childId) return;
    setCreating(true); setError('');
    try {
      await firebaseBridge.auth.createAccessCode(childId, role, label.trim(), expiry ? Number(expiry) : undefined);
      setLabel('');
      await load();
    } catch (e: any) { setError(e.message || 'Erro ao gerar código.'); }
    finally { setCreating(false); }
  };

  const revoke = async (id: string) => {
    setError('');
    try { await firebaseBridge.auth.revokeAccessCode(id); await load(); }
    catch (e: any) { setError(e.message || 'Erro ao revogar.'); }
  };

  const copy = (code: string) => {
    try { navigator.clipboard?.writeText(code); } catch {}
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const inputCls = 'px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold outline-none focus:border-indigo-500';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-4.5 h-4.5 text-indigo-600" />
        <h3 className="text-sm font-black text-slate-800 font-Outfit tracking-tight">
          {locale === 'en' ? 'Access codes (support network)' : locale === 'es' ? 'Códigos de acceso (red de apoyo)' : 'Códigos de acesso (rede de apoio)'}
        </h3>
      </div>
      <p className="text-xs text-slate-500 -mt-2 leading-relaxed">
        {locale === 'en' ? 'Give each therapist or school its own code, with the right permission. Revoke any time.' : locale === 'es' ? 'Da a cada terapeuta o escuela su propio código, con el permiso correcto. Revoca cuando quieras.' : 'Dê a cada terapeuta ou escola um código próprio, com a permissão certa. Revogue quando quiser.'}
      </p>

      {/* Create */}
      <div className="flex flex-col gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={role} onChange={e => setRole(e.target.value)} className={`${inputCls} cursor-pointer`}>
            {(['therapist', 'school', 'readonly'] as const).map(r => (
              <option key={r} value={r}>{roles[r].label}</option>
            ))}
          </select>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={locale === 'en' ? 'Name (optional)' : locale === 'es' ? 'Nombre (opcional)' : 'Nome (opcional)'} className={`${inputCls} flex-1`} />
          <select value={expiry} onChange={e => setExpiry(e.target.value)} className={`${inputCls} cursor-pointer`}>
            <option value="30">30 {locale === 'en' ? 'days' : locale === 'es' ? 'días' : 'dias'}</option>
            <option value="90">90 {locale === 'en' ? 'days' : locale === 'es' ? 'días' : 'dias'}</option>
            <option value="365">1 {locale === 'en' ? 'year' : locale === 'es' ? 'año' : 'ano'}</option>
            <option value="">{locale === 'en' ? 'Never' : locale === 'es' ? 'Nunca' : 'Sem prazo'}</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">{roles[role as 'therapist'].hint}</span>
          <button
            onClick={create}
            disabled={creating || !childId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 grad-primary text-white text-xs font-black rounded-lg cursor-pointer active:scale-95 disabled:opacity-50 transition-all font-Outfit"
          >
            <Plus className="w-3.5 h-3.5" /> {creating ? '...' : (locale === 'en' ? 'Generate' : locale === 'es' ? 'Generar' : 'Gerar código')}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

      {/* List */}
      <div className="flex flex-col">
        {loading ? (
          <p className="text-xs text-slate-400 py-3 text-center">...</p>
        ) : codes.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">{locale === 'en' ? 'No codes yet.' : locale === 'es' ? 'Aún no hay códigos.' : 'Nenhum código ainda.'}</p>
        ) : codes.map(c => {
          const st = statusOf(c, locale);
          const active = st.text === 'Active' || st.text === 'Activo' || st.text === 'Ativo';
          return (
            <div key={c.id} className="flex items-center gap-3 py-2.5 border-t border-slate-100">
              <button onClick={() => copy(c.code)} title="Copiar" className="inline-flex items-center gap-1.5 font-mono font-black text-slate-800 text-sm bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border-none">
                {c.code} {copied === c.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-slate-700 truncate">{roles[c.role as 'therapist']?.label || c.role}{c.label ? ` · ${c.label}` : ''}</div>
                <div className="text-[10px] text-slate-400">{c.expiresAt ? `${locale === 'en' ? 'until' : locale === 'es' ? 'hasta' : 'até'} ${new Date(c.expiresAt).toLocaleDateString()}` : (locale === 'en' ? 'no expiry' : locale === 'es' ? 'sin caducidad' : 'sem prazo')}</div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${st.cls}`}>{st.text}</span>
              {active && (
                <button onClick={() => revoke(c.id)} title={locale === 'en' ? 'Revoke' : locale === 'es' ? 'Revocar' : 'Revogar'} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors border-none bg-transparent">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
