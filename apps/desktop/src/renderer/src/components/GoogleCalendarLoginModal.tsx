import * as Dialog from '@radix-ui/react-dialog'
import { CalendarBlank, ArrowRight, X } from '@phosphor-icons/react'

interface GoogleCalendarLoginModalProps {
  open: boolean
  onClose: () => void
  onConnect: () => void | Promise<void>
  isBusy?: boolean
  errorMessage?: string | null
}

function GoogleLogo(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

const FEATURES = [
  'See all your events alongside your schedule',
  'Two-way sync — changes reflect instantly',
  'All your calendars, one clean view',
]

export default function GoogleCalendarLoginModal({
  open,
  onClose,
  onConnect,
  isBusy = false,
  errorMessage = null,
}: GoogleCalendarLoginModalProps): React.JSX.Element {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v && !isBusy) {
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />
        <Dialog.Content
          data-radix-dialog-content
          className="fixed z-50 outline-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 380,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
          onEscapeKeyDown={(event) => {
            if (isBusy) {
              event.preventDefault()
            }
          }}
          onPointerDownOutside={(event) => {
            if (isBusy) {
              event.preventDefault()
            }
          }}
        >
          {/* Close button */}
          <button
            className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-md transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: 'var(--text-dim)' }}
            onClick={onClose}
            disabled={isBusy}
            onMouseEnter={(e) => {
              if (!isBusy) {
                e.currentTarget.style.background = 'var(--surface-3)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            <X size={13} weight="bold" />
          </button>

          {/* Top strip */}
          <div
            className="flex flex-col items-center pt-8 pb-6 px-8"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {/* Icon cluster */}
            <div className="relative mb-5">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <CalendarBlank size={28} style={{ color: 'var(--accent)' }} />
              </div>
              <div
                className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-6 h-6 rounded-full"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <GoogleLogo />
              </div>
            </div>

            <Dialog.Title
              className="text-base font-semibold text-center mb-1.5"
              style={{ color: 'var(--text)' }}
            >
              Connect Google Calendar
            </Dialog.Title>
            <Dialog.Description
              className="text-xs text-center leading-relaxed"
              style={{ color: 'var(--text-muted)', maxWidth: 260 }}
            >
              Sign in once to bring your Google Calendar events into this view.
            </Dialog.Description>
          </div>

          {/* Feature list */}
          <div className="px-8 py-5 flex flex-col gap-3">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--accent)', marginTop: 5 }}
                />
                <span className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-8 pb-7 flex flex-col gap-2.5">
            {errorMessage && (
              <div
                className="rounded-lg px-3 py-2 text-xs leading-snug"
                style={{
                  background: 'rgba(192,120,96,0.12)',
                  color: '#C98A76',
                  border: '1px solid rgba(192,120,96,0.28)',
                }}
              >
                {errorMessage}
              </div>
            )}
            <button
              onClick={onConnect}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2.5 h-9 rounded-lg text-xs font-semibold transition-all duration-100 disabled:opacity-70 disabled:cursor-wait"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-on)',
              }}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.filter = 'brightness(1.08)'
                }
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <GoogleLogo />
              {isBusy ? 'Connecting...' : 'Sign in with Google'}
              <ArrowRight size={13} weight="bold" />
            </button>
            <button
              onClick={onClose}
              disabled={isBusy}
              className="w-full flex items-center justify-center h-8 rounded-lg text-xs transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) => {
                if (!isBusy) {
                  e.currentTarget.style.background = 'var(--surface-2)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-dim)'
              }}
            >
              Maybe later
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
