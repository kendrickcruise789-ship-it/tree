import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Currency, Product } from '../../types';
import {
  applyChange,
  claimShop,
  fetchSession,
  resetCatalogueToBundled,
} from '../../shop/api';
import type { SessionState } from '../../shop/schema';
import { EDITABLE_CATEGORIES, blankProduct, totalStock } from '../../shop/schema';
import { categoryLabel } from '../../data/products';
import { formatPrice } from '../../utils/currency';
import { Reveal } from '../Reveal';
import { isStaleRevisionMessage } from './validation';
import { ProductThumb } from './ProductThumb';
import { ProductEditor } from './ProductEditor';
import {
  Search,
  X,
  Plus,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  CircleAlert,
  CircleCheck,
  RefreshCw,
  Info,
  UserRound,
} from 'lucide-react';

export interface OwnerPanelProps {
  products: Product[];
  revision: number;
  currency: Currency;
  onCatalogueChange: (next: { products: Product[]; revision: number }) => void;
  onReloadRequested?: () => void;
}

type SessionPhase =
  | { phase: 'loading' }
  | { phase: 'ready'; session: SessionState };

const ALL_FILTER = 'All';

/** `signed_out` carries whether some other account already owns this shop. */
const claimedByAnother = (session: Extract<SessionState, { status: 'signed_out' }>): boolean =>
  session.ownerClaimed;

/**
 * The platform's own sign-in entry. It hands the visitor back to the site root, so the
 * panel tells them how to return here once they have an identity.
 */
const QODER_SIGN_IN = '/__qoder_auth/start?return_path=%2F';

export const OwnerPanel: React.FC<OwnerPanelProps> = ({
  products,
  revision,
  currency,
  onCatalogueChange,
  onReloadRequested,
}) => {
  const [phase, setPhase] = useState<SessionPhase>({ phase: 'loading' });
  const [claiming, setClaiming] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(ALL_FILTER);

  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'create'>('edit');
  const [createDraft, setCreateDraft] = useState<Product | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [unknownOutcome, setUnknownOutcome] = useState(false);
  const [savedFlashId, setSavedFlashId] = useState<string | null>(null);

  const [restoring, setRestoring] = useState(false);
  const [restoreArmed, setRestoreArmed] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelStatus, setPanelStatus] = useState<string | null>(null);

  const savedTimer = useRef<number | null>(null);

  async function loadSession() {
    setPhase({ phase: 'loading' });
    const session = await fetchSession();
    setPhase({ phase: 'ready', session });
  }

  useEffect(() => {
    void loadSession();
    return () => {
      if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const session = phase.phase === 'ready' ? phase.session : null;
  const isOwner = session?.status === 'owner';

  const visible = useMemo(() => {
    if (!isOwner || !session || session.status !== 'owner') return [];
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (category !== ALL_FILTER && product.category !== category) return false;
        if (!query) return true;
        return product.title.toLowerCase().includes(query) || product.id.toLowerCase().includes(query);
      })
      .slice()
      .sort((a, b) => {
        const byCat = categoryLabel(a.category).localeCompare(categoryLabel(b.category));
        return byCat !== 0 ? byCat : a.title.localeCompare(b.title);
      });
  }, [products, category, search, isOwner, session]);

  function clearRowStatus() {
    setRowError(null);
    setUnknownOutcome(false);
  }

  function collapse() {
    setOpenId(null);
    setCreateDraft(null);
    clearRowStatus();
  }

  function selectRow(product: Product) {
    if (openId === product.id && mode === 'edit') {
      collapse();
      return;
    }
    setOpenId(product.id);
    setMode('edit');
    setCreateDraft(null);
    clearRowStatus();
  }

  function startCreate() {
    const product = blankProduct(`own-${Date.now().toString(36)}`);
    setCreateDraft(product);
    setOpenId(product.id);
    setMode('create');
    clearRowStatus();
  }

  function markSaved(id: string) {
    setSavedFlashId(id);
    if (savedTimer.current !== null) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => {
      setSavedFlashId((current) => (current === id ? null : current));
    }, 2500);
  }

  async function handleSaveProduct(product: Product) {
    if (busyId !== null) return; // guard against double submission
    setBusyId(product.id);
    clearRowStatus();
    const kind = mode === 'create' ? 'create' : 'save';
    const result = await applyChange(revision, { kind, product });
    setBusyId(null);
    if ('error' in result) {
      setRowError(result.error);
      setUnknownOutcome(result.unknownOutcome);
      return;
    }
    onCatalogueChange({ products: result.products, revision: result.revision });
    markSaved(product.id);
    if (mode === 'create') {
      setMode('edit');
      setCreateDraft(null);
    }
  }

  async function handleRetire(id: string) {
    if (busyId !== null) return;
    setBusyId(id);
    clearRowStatus();
    const result = await applyChange(revision, { kind: 'retire', id });
    setBusyId(null);
    if ('error' in result) {
      setRowError(result.error);
      setUnknownOutcome(result.unknownOutcome);
      return;
    }
    onCatalogueChange({ products: result.products, revision: result.revision });
    collapse();
  }

  async function runRestore() {
    if (restoring) return;
    setRestoreArmed(false);
    setRestoring(true);
    setPanelError(null);
    setPanelStatus(null);
    const result = await resetCatalogueToBundled(revision);
    setRestoring(false);
    if ('error' in result) {
      setPanelError(result.error);
      return;
    }
    onCatalogueChange({ products: result.products, revision: result.revision });
    collapse();
    setPanelStatus('The starter catalogue is back. Your edits were replaced.');
  }

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    setAuthError(null);
    const result = await claimShop();
    setClaiming(false);
    if (!result.ok) {
      setAuthError(result.error ?? 'Could not claim the shop.');
      return;
    }
    void loadSession();
  }

  return (
    <section className="bg-[#FDFBF7] min-h-screen py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <header className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C6934B]">Clotex</p>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#1E1B18] mt-1">Shop owner panel</h1>
            <p className="text-sm text-[#5C5349] mt-2 max-w-prose">
              Edit prices, stock and pictures, and add or retire pieces here. Everything you save shows on the
              live shop.
            </p>
          </header>
        </Reveal>

        {phase.phase === 'loading' && (
          <LoadingCard label="Checking who manages this shop…" />
        )}

        {phase.phase === 'ready' && session && (
          <>
            {session.status === 'service_unavailable' && <Guidance />}

            {session.status === 'signed_out' && (
              <div className="space-y-4">
                <Notice tone="muted" icon={<UserRound className="w-4 h-4 shrink-0" />}>
                  {claimedByAnother(session)
                    ? 'This shop is managed by another account. Sign in with that account to make changes.'
                    : 'Sign in with your account to manage this shop from here.'}
                </Notice>
                <div className="flex flex-wrap gap-3">
                  <SignInLink />
                  <RecheckButton onClick={() => void loadSession()} />
                </div>
              </div>
            )}

            {session.status === 'unclaimed' && (
              <div className="space-y-4">
                <Notice tone="muted" icon={<Info className="w-4 h-4 shrink-0" />}>
                  This shop isn&apos;t managed yet. Claim it to start editing prices, stock and pictures.
                </Notice>
                {authError && <ErrorLine message={authError} />}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleClaim()}
                    disabled={claiming}
                    className="inline-flex items-center gap-2 bg-[#1E1B18] text-[#FDFBF7] text-[12px] uppercase tracking-[0.14em] px-5 py-2.5 hover:bg-[#342F2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {claiming ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Claim this shop
                  </button>
                  <RecheckButton onClick={() => void loadSession()} />
                </div>
              </div>
            )}

            {session.status === 'not_owner' && (
              <div className="space-y-4">
                <Notice tone="muted" icon={<UserRound className="w-4 h-4 shrink-0" />}>
                  This shop is managed by another account. Sign in with that account to make changes.
                </Notice>
                <div className="flex flex-wrap gap-3">
                  <SignInLink />
                  <RecheckButton onClick={() => void loadSession()} />
                </div>
              </div>
            )}

            {session.status === 'owner' && (
              <div className="space-y-6">
                <OwnerIdentity owner={session.owner} />

                <Toolbar
                  search={search}
                  onSearch={setSearch}
                  category={category}
                  onCategory={setCategory}
                  onAdd={startCreate}
                  restoring={restoring}
                  restoreArmed={restoreArmed}
                  onArmRestore={() => setRestoreArmed(true)}
                  onCancelRestore={() => setRestoreArmed(false)}
                  onRestore={() => void runRestore()}
                />

                <div aria-live="polite" className="space-y-2">
                  {panelStatus && (
                    <Notice tone="gold" icon={<CircleCheck className="w-4 h-4 shrink-0" />}>
                      {panelStatus}
                    </Notice>
                  )}
                  {panelError && (
                    <div className="flex flex-col gap-2 items-start">
                      <ErrorLine message={panelError} />
                      {isStaleRevisionMessage(panelError) && onReloadRequested && (
                        <ReloadButton onClick={onReloadRequested} />
                      )}
                    </div>
                  )}
                </div>

                {mode === 'create' && createDraft && (
                  <EditorShell>
                    <ProductEditor
                      key={createDraft.id}
                      base={createDraft}
                      mode="create"
                      currency={currency}
                      saving={busyId === createDraft.id}
                      error={rowError}
                      unknownOutcome={unknownOutcome}
                      savedFlash={savedFlashId === createDraft.id}
                      onReload={onReloadRequested}
                      onSave={handleSaveProduct}
                      onRetire={handleRetire}
                      onClose={collapse}
                    />
                  </EditorShell>
                )}

                <div className="border border-[#EDE6DC] bg-[#FDFBF7]">
                  <RowHeader />
                  {visible.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-[#5C5349]">
                      No products match your search.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#EDE6DC]">
                      {visible.map((product) => {
                        const open = openId === product.id && mode === 'edit';
                        return (
                          <li key={product.id}>
                            <Row
                              product={product}
                              currency={currency}
                              open={open}
                              saved={savedFlashId === product.id}
                              needsAttention={open && (unknownOutcome || isStaleRevisionMessage(rowError))}
                              onToggle={() => selectRow(product)}
                            />
                            {open && (
                              <EditorShell>
                                <ProductEditor
                                  key={product.id}
                                  base={product}
                                  mode="edit"
                                  currency={currency}
                                  saving={busyId === product.id}
                                  error={rowError}
                                  unknownOutcome={unknownOutcome}
                                  savedFlash={savedFlashId === product.id}
                                  onReload={onReloadRequested}
                                  onSave={handleSaveProduct}
                                  onRetire={handleRetire}
                                  onClose={collapse}
                                />
                              </EditorShell>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const EditorShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#FAF7F2] border-l-2 border-[#C6934B]">{children}</div>
);

const OwnerIdentity: React.FC<{ owner: { name: string; picture: string } }> = ({ owner }) => (
  <div className="flex items-center gap-3 text-sm text-[#5C5349]">
    {owner.picture ? (
      <img
        src={owner.picture}
        alt=""
        referrerPolicy="no-referrer"
        className="w-9 h-9 rounded-full object-cover border border-[#EDE6DC]"
      />
    ) : (
      <span className="w-9 h-9 rounded-full bg-[#1E1B18] text-[#FDFBF7] flex items-center justify-center text-[11px] font-semibold uppercase">
        {owner.name.slice(0, 1)}
      </span>
    )}
    <span>
      Managing this shop as <span className="text-[#1E1B18] font-medium">{owner.name}</span>
    </span>
  </div>
);

interface ToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
  onAdd: () => void;
  restoring: boolean;
  restoreArmed: boolean;
  onArmRestore: () => void;
  onCancelRestore: () => void;
  onRestore: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  search,
  onSearch,
  category,
  onCategory,
  onAdd,
  restoring,
  restoreArmed,
  onArmRestore,
  onCancelRestore,
  onRestore,
}) => (
  <div className="space-y-3">
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A89C8F]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name or code"
          aria-label="Search products"
          className="w-full bg-[#FDFBF7] border border-[#EDE6DC] pl-9 pr-9 py-2.5 text-sm text-[#1E1B18] placeholder:text-[#A89C8F] focus:outline-none focus:border-[#C6934B] focus:ring-1 focus:ring-[#C6934B]/40"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C5349] hover:text-[#1E1B18]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <select
        value={category}
        onChange={(e) => onCategory(e.target.value)}
        aria-label="Filter by category"
        className="bg-[#FDFBF7] border border-[#EDE6DC] px-3 py-2.5 text-sm text-[#1E1B18] focus:outline-none focus:border-[#C6934B] focus:ring-1 focus:ring-[#C6934B]/40"
      >
        <option value={ALL_FILTER}>All categories</option>
        {EDITABLE_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {categoryLabel(cat)}
          </option>
        ))}
      </select>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-4 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
      >
        <Plus className="w-4 h-4" /> Add product
      </button>

      {restoreArmed ? (
        <div className="inline-flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#5C5349]">Replace everything with the starter catalogue?</span>
          <button
            type="button"
            onClick={onRestore}
            disabled={restoring}
            className="bg-[#A8523C] text-[#FDFBF7] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#8a3f2d] transition-colors disabled:opacity-50"
          >
            Yes, restore it
          </button>
          <button
            type="button"
            onClick={onCancelRestore}
            className="text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onArmRestore}
          disabled={restoring}
          className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-[#5C5349] hover:text-[#1E1B18] transition-colors px-2 py-2 disabled:opacity-50"
        >
          {restoring ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Restore the starter catalogue
        </button>
      )}
    </div>
  </div>
);

const RowHeader: React.FC = () => (
  <div className="hidden md:flex md:items-center md:gap-4 px-4 py-2.5 border-b border-[#EDE6DC] text-[10px] uppercase tracking-[0.2em] text-[#5C5349]">
    <span className="flex-1 min-w-0">Piece</span>
    <span className="w-28 shrink-0">Category</span>
    <span className="w-20 shrink-0">Price</span>
    <span className="w-20 shrink-0">Was</span>
    <span className="w-16 shrink-0">Stock</span>
    <span className="w-32 shrink-0">Markers</span>
    <span className="w-6 shrink-0" aria-hidden="true" />
  </div>
);

interface RowProps {
  product: Product;
  currency: Currency;
  open: boolean;
  saved: boolean;
  needsAttention: boolean;
  onToggle: () => void;
}

const Row: React.FC<RowProps> = ({ product, currency, open, saved, needsAttention, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    className={`w-full text-left px-4 py-3 flex items-start md:items-center md:gap-4 transition-colors hover:bg-[#FAF7F2] ${
      open ? 'bg-[#FAF7F2]' : ''
    }`}
  >
    {/* Desktop: single inline row */}
    <span className="hidden md:flex md:items-center md:flex-1 md:min-w-0 md:gap-3">
      <ProductThumb ref={product.image} alt={product.title} className="w-12 h-14" />
      <span className="min-w-0">
        <span className="block truncate text-sm text-[#1E1B18]">{product.title}</span>
        <span className="block truncate text-[11px] text-[#5C5349] break-all">{product.id}</span>
      </span>
    </span>
    <span className="hidden md:block w-28 shrink-0 text-xs text-[#5C5349] truncate">{categoryLabel(product.category)}</span>
    <span className="hidden md:block w-20 shrink-0 text-sm text-[#1E1B18] tabular-nums">{formatPrice(product.price, currency)}</span>
    <span className="hidden md:block w-20 shrink-0 text-xs text-[#5C5349] tabular-nums line-through">
      {product.originalPrice ? formatPrice(product.originalPrice, currency) : '—'}
    </span>
    <span className="hidden md:block w-16 shrink-0 text-sm text-[#1E1B18] tabular-nums">{totalStock(product)}</span>
    <span className="hidden md:flex w-32 shrink-0 flex-wrap gap-1">
      <Markers product={product} saved={saved} />
    </span>
    <span className="hidden md:flex w-6 shrink-0 justify-center text-[#5C5349]">
      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </span>

    {/* Mobile: stacked, never overflows the viewport */}
    <span className="md:hidden flex-1 min-w-0 space-y-2">
      <span className="flex items-start gap-3">
        <ProductThumb ref={product.image} alt={product.title} className="w-12 h-14" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-[#1E1B18] leading-snug">{product.title}</span>
          <span className="block text-[11px] text-[#5C5349] break-all">{product.id}</span>
        </span>
        <span className="shrink-0 text-[#5C5349]">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5C5349]">
        <span>{categoryLabel(product.category)}</span>
        <span className="text-[#1E1B18] tabular-nums">{formatPrice(product.price, currency)}</span>
        {product.originalPrice && <span className="line-through tabular-nums">{formatPrice(product.originalPrice, currency)}</span>}
        <span className="tabular-nums">{totalStock(product)} in stock</span>
      </span>
      <span className="flex flex-wrap gap-1">
        <Markers product={product} saved={saved} />
        {needsAttention && <Tag text="Check" tone="danger" />}
      </span>
    </span>
  </button>
);

const Markers: React.FC<{ product: Product; saved: boolean }> = ({ product, saved }) => (
  <>
    {saved && <Tag text="Saved" tone="gold" />}
    {product.isNewArrival && <Tag text="New" tone="ink" />}
    {product.isBestSeller && <Tag text="Bestseller" tone="muted" />}
    {product.onSale && <Tag text="Sale" tone="sale" />}
  </>
);

const Tag: React.FC<{ text: string; tone: 'ink' | 'gold' | 'muted' | 'sale' | 'danger' }> = ({ text, tone }) => {
  const tones: Record<typeof tone, string> = {
    ink: 'bg-[#1E1B18] text-[#FDFBF7]',
    gold: 'bg-[#C6934B] text-[#FDFBF7]',
    muted: 'border border-[#EDE6DC] text-[#5C5349]',
    sale: 'bg-[#A8523C] text-[#FDFBF7]',
    danger: 'border border-[#A8523C]/40 text-[#A8523C]',
  };
  return (
    <span className={`text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 whitespace-nowrap ${tones[tone]}`}>
      {text}
    </span>
  );
};

const SignInLink: React.FC = () => (
  <a
    href={QODER_SIGN_IN}
    className="inline-flex items-center gap-2 bg-[#1E1B18] text-[#FDFBF7] text-[12px] uppercase tracking-[0.14em] px-5 py-2.5 hover:bg-[#342F2A] transition-colors"
  >
    <UserRound className="w-4 h-4" /> Sign in with Qoder
  </a>
);

const RecheckButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-4 py-2 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
  >
    <RefreshCw className="w-4 h-4" /> Check sign-in again
  </button>
);

const ReloadButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 border border-[#1E1B18] text-[#1E1B18] text-[12px] uppercase tracking-[0.12em] px-3 py-1.5 hover:bg-[#1E1B18] hover:text-[#FDFBF7] transition-colors"
  >
    <RefreshCw className="w-3.5 h-3.5" /> Reload latest
  </button>
);

const Guidance: React.FC = () => (
  <div className="border border-[#EDE6DC] bg-[#FBF8F2] p-6 space-y-2">
    <p className="font-serif text-lg text-[#1E1B18]">This copy of the site has no shop service behind it.</p>
    <p className="text-sm text-[#5C5349] max-w-prose">
      Prices are edited on the hosted site, where the shop service is connected. Open Clotex there to manage this
      shop from a browser tab that can reach it.
    </p>
  </div>
);

const ErrorLine: React.FC<{ message: string }> = ({ message }) => (
  <p className="flex items-start gap-2 text-sm text-[#A8523C]">
    <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />
    <span>{message}</span>
  </p>
);

const LoadingCard: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 border border-[#EDE6DC] bg-[#FBF8F2] p-6 text-sm text-[#5C5349]">
    <LoaderCircle className="w-4 h-4 animate-spin" />
    {label}
  </div>
);

const Notice: React.FC<{ tone: 'muted' | 'gold'; icon: React.ReactNode; children: React.ReactNode }> = ({
  tone,
  icon,
  children,
}) => (
  <div
    className={`flex items-start gap-2.5 border p-4 text-sm ${
      tone === 'gold' ? 'border-[#C6934B]/40 bg-[#C6934B]/5 text-[#1E1B18]' : 'border-[#EDE6DC] bg-[#FBF8F2] text-[#5C5349]'
    }`}
  >
    <span className="mt-0.5 text-[#5C5349]">{icon}</span>
    <span className="min-w-0">{children}</span>
  </div>
);

export default OwnerPanel;
