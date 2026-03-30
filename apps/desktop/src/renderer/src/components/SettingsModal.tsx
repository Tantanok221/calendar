import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, GoogleLogo, CheckCircle, WarningCircle, ArrowClockwise } from '@phosphor-icons/react'
import type { GoogleCalendarConnectionStatus } from '../../../main/googleCalendar/types'

type SettingsSection = 'integrations'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  googleCalendarStatus: GoogleCalendarConnectionStatus | null
  isConnectPending: boolean
  errorMessage: string | null
  onGoogleConnect: () => void
}

function GoogleCalendarRow({
  status,
  isPending,
  errorMessage,
  onConnect,
}: {
  status: GoogleCalendarConnectionStatus | null
  isPending: boolean
  errorMessage: string | null
  onConnect: () => void
}): React.JSX.Element {
  const isConnected = status?.connected === true

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--border-strong)',
        }}
      >
        <GoogleLogo size={18} weight="bold" style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Google Calendar
        </span>
        {isConnected ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle size={11} weight="fill" style={{ color: '#6dbe7e' }} />
            <span className="text-[11px]" style={{ color: '#6dbe7e' }}>
              Connected
            </span>
          </div>
        ) : errorMessage ? (
          <div className="flex items-center gap-1.5">
            <WarningCircle size={11} weight="fill" style={{ color: '#c07860' }} />
            <span className="text-[11px] truncate" style={{ color: '#c07860' }}>
              {errorMessage}
            </span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
            Not connected
          </span>
        )}
      </div>

      {/* Action */}
      {!isConnected && (
        <button
          onClick={onConnect}
          disabled={isPending}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold shrink-0 transition-all duration-100"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            opacity: isPending ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isPending) e.currentTarget.style.filter = 'brightness(1.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none'
          }}
        >
          {isPending ? (
            <>
              <ArrowClockwise
                size={11}
                weight="bold"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Connecting…
            </>
          ) : (
            'Connect'
          )}
        </button>
      )}
    </div>
  )
}

const NAV_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: 'integrations', label: 'Integrations' },
]

export default function SettingsModal({
  open,
  onClose,
  googleCalendarStatus,
  isConnectPending,
  errorMessage,
  onGoogleConnect,
}: SettingsModalProps): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection>('integrations')

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)' }}
        />
        <Dialog.Content
          data-radix-dialog-content
          className="fixed z-50 outline-none flex overflow-hidden"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 560,
            height: 380,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 14,
          }}
        >
          {/* Left nav */}
          <div
            className="flex flex-col shrink-0 pt-10 pb-3 px-2 gap-0.5"
            style={{
              width: 160,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg)',
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-2 pb-1.5"
              style={{ color: 'var(--text-dim)' }}
            >
              Settings
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="flex items-center h-7 px-2 rounded-md text-xs transition-colors duration-100 text-left"
                style={
                  activeSection === item.id
                    ? {
                        background: 'var(--surface-3)',
                        color: 'var(--text)',
                      }
                    : { color: 'var(--text-muted)' }
                }
                onMouseEnter={(e) => {
                  if (activeSection !== item.id)
                    e.currentTarget.style.background = 'var(--surface-2)'
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.id)
                    e.currentTarget.style.background = 'transparent'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 min-w-0 pt-10 px-5 pb-5">
            {/* Close */}
            <Dialog.Close asChild>
              <button
                className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-md transition-colors z-10"
                style={{ color: 'var(--text-dim)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-dim)'
                }}
              >
                <X size={13} weight="bold" />
              </button>
            </Dialog.Close>

            {activeSection === 'integrations' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Dialog.Title
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: 'var(--text)' }}
                  >
                    Integrations
                  </Dialog.Title>
                  <Dialog.Description
                    className="text-[11px]"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Connect external calendar accounts to sync your events.
                  </Dialog.Description>
                </div>

                <div className="flex flex-col gap-2">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    Accounts
                  </p>
                  <GoogleCalendarRow
                    status={googleCalendarStatus}
                    isPending={isConnectPending}
                    errorMessage={errorMessage}
                    onConnect={onGoogleConnect}
                  />
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
