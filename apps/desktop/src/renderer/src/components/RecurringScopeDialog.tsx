import * as Dialog from '@radix-ui/react-dialog'
import { PencilSimple, Trash, CalendarBlank, Repeat } from '@phosphor-icons/react'
import {
  getRecurringScopeActionState,
  type RecurringScopeActionKind,
  type RecurringScopeBusyScope
} from '../lib/recurringScopeActions'

interface RecurringScopeDialogProps {
  open: boolean
  onClose: () => void
  kind: RecurringScopeActionKind
  busyScope: RecurringScopeBusyScope
  onChooseInstance: () => void
  onChooseSeries: () => void
}

interface RecurringScopeDialogBodyProps {
  onClose: () => void
  kind: RecurringScopeActionKind
  busyScope: RecurringScopeBusyScope
  onChooseInstance: () => void
  onChooseSeries: () => void
}

function Spinner({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: 999,
        border: `1.5px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0
      }}
    />
  )
}

function RecurringScopeDialogContent({
  onClose,
  kind,
  busyScope,
  onChooseInstance,
  onChooseSeries
}: RecurringScopeDialogBodyProps): React.JSX.Element {
  const actionState = getRecurringScopeActionState(kind, busyScope)
  const isDelete = kind === 'delete'

  const accent = isDelete ? '#C98A76' : '#d7ceb2'
  const accentBg = isDelete ? 'rgba(201,138,118,0.09)' : 'rgba(215,206,178,0.09)'
  const accentBorder = isDelete ? 'rgba(201,138,118,0.28)' : 'rgba(215,206,178,0.28)'

  const title = isDelete ? 'Delete repeating event?' : 'Update repeating event?'
  const description = isDelete
    ? 'Pick whether to remove only this occurrence or clear the entire series.'
    : 'Pick whether these edits should apply to just this occurrence or the whole series.'

  const busyMessage =
    busyScope === 'instance'
      ? isDelete
        ? 'Removing only this occurrence...'
        : 'Saving changes to this occurrence...'
      : busyScope === 'series'
        ? isDelete
          ? 'Removing the entire series...'
          : 'Saving changes to every event in the series...'
        : isDelete
          ? 'This only affects the selected recurring event.'
          : 'Your changes will sync back to the selected recurring event.'

  const options = [
    {
      scope: 'instance' as const,
      scopeLabel: 'This event',
      icon: <CalendarBlank size={13} weight="bold" />,
      label: actionState.instanceLabel,
      description: isDelete
        ? 'Remove the selected occurrence and keep every other event in the series untouched.'
        : 'Save your changes only here and leave the rest of the series exactly as it is.',
      pillLabel: 'One event',
      handler: onChooseInstance
    },
    {
      scope: 'series' as const,
      scopeLabel: 'All events',
      icon: <Repeat size={13} weight="bold" />,
      label: actionState.seriesLabel,
      description: isDelete
        ? 'Remove every linked occurrence so the full repeating series disappears from your calendar.'
        : 'Apply these changes across every linked occurrence so the whole series stays in sync.',
      pillLabel: 'Whole series',
      handler: onChooseSeries
    }
  ]

  return (
    <Dialog.Content
      data-radix-dialog-content
      className="fixed z-50 flex flex-col outline-none"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 460,
        maxWidth: 'calc(100vw - 24px)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: '0 24px 56px rgba(0,0,0,0.48), 0 4px 12px rgba(0,0,0,0.24)',
        overflow: 'hidden'
      }}
    >
      {/* Accent top strip */}
      <div
        style={{
          height: 2,
          background: accent,
          opacity: 0.7,
          flexShrink: 0
        }}
      />

      {/* Header */}
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: isDelete ? 'rgba(201,138,118,0.13)' : 'rgba(215,206,178,0.11)',
              border: `1px solid ${accentBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              flexShrink: 0,
              marginTop: 1
            }}
          >
            {isDelete ? <Trash size={14} /> : <PencilSimple size={14} />}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Dialog.Title
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.3,
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Description
              style={{
                fontSize: 11.5,
                color: 'var(--text-muted)',
                marginTop: 3,
                lineHeight: 1.5
              }}
            >
              {description}
            </Dialog.Description>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Options */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {options.map((option) => {
          const isActive = busyScope === option.scope
          const isOtherBusy = actionState.isBusy && !isActive

          return (
            <button
              key={option.scope}
              type="button"
              disabled={actionState.isBusy}
              aria-busy={isActive}
              onClick={option.handler}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '11px 13px',
                borderRadius: 9,
                border: `1px solid ${isActive ? accentBorder : 'var(--border-strong)'}`,
                background: isActive ? accentBg : 'var(--surface-3)',
                opacity: isOtherBusy ? 0.3 : 1,
                cursor: actionState.isBusy ? (isActive ? 'wait' : 'default') : 'pointer',
                transition: 'opacity 0.25s ease, border-color 0.15s ease, background 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: isActive ? 'scope-card-pulse 2s ease-in-out infinite' : 'none'
              }}
            >
              {/* Shimmer sweep when loading */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '40%',
                    background: `linear-gradient(90deg, transparent, ${isDelete ? 'rgba(201,138,118,0.12)' : 'rgba(215,206,178,0.1)'}, transparent)`,
                    animation: 'scope-shimmer 1.8s ease-in-out infinite',
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Row 1: scope badge + status pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 5
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: isActive ? accent : 'var(--text-dim)'
                  }}
                >
                  <span style={{ color: isActive ? accent : 'var(--text-dim)', opacity: 0.85 }}>
                    {option.icon}
                  </span>
                  {option.scopeLabel}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: isActive ? accent : 'var(--text-dim)',
                    transition: 'color 0.15s ease'
                  }}
                >
                  {isActive && <Spinner size={10} color={accent} />}
                  <span>{isActive ? 'Working' : option.pillLabel}</span>
                </div>
              </div>

              {/* Action label */}
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 4,
                  lineHeight: 1.3
                }}
              >
                {option.label}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55
                }}
              >
                {option.description}
              </div>

              {/* Progress bar at card bottom */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '45%',
                      background: accent,
                      opacity: 0.6,
                      animation: 'scope-progress 1.5s ease-in-out infinite'
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Footer */}
      <div
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10.5,
            color: actionState.isBusy ? accent : 'var(--text-dim)',
            transition: 'color 0.2s ease',
            minWidth: 0,
            flex: 1
          }}
        >
          {actionState.isBusy && <Spinner size={11} color={accent} />}
          <span>{busyMessage}</span>
        </div>

        <button
          type="button"
          disabled={actionState.closeDisabled}
          onClick={onClose}
          className="rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            padding: '5px 12px',
            fontSize: 11.5,
            fontWeight: 500,
            color: 'var(--text-muted)',
            background: 'var(--surface-3)',
            border: '1px solid var(--border-strong)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (!actionState.closeDisabled) {
              e.currentTarget.style.color = 'var(--text)'
              e.currentTarget.style.borderColor = 'rgba(215,206,178,0.35)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
            e.currentTarget.style.borderColor = 'var(--border-strong)'
          }}
        >
          Cancel
        </button>
      </div>
    </Dialog.Content>
  )
}

export function RecurringScopeDialogBody({
  onClose,
  kind,
  busyScope,
  onChooseInstance,
  onChooseSeries
}: RecurringScopeDialogBodyProps): React.JSX.Element {
  return (
    <Dialog.Root open>
      <RecurringScopeDialogContent
        onClose={onClose}
        kind={kind}
        busyScope={busyScope}
        onChooseInstance={onChooseInstance}
        onChooseSeries={onChooseSeries}
      />
    </Dialog.Root>
  )
}

export default function RecurringScopeDialog({
  open,
  onClose,
  kind,
  busyScope,
  onChooseInstance,
  onChooseSeries
}: RecurringScopeDialogProps): React.JSX.Element {
  const actionState = getRecurringScopeActionState(kind, busyScope)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && !actionState.closeDisabled && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-radix-dialog-overlay
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(12, 10, 8, 0.68)' }}
        />
        <RecurringScopeDialogContent
          onClose={onClose}
          kind={kind}
          busyScope={busyScope}
          onChooseInstance={onChooseInstance}
          onChooseSeries={onChooseSeries}
        />
      </Dialog.Portal>
    </Dialog.Root>
  )
}
