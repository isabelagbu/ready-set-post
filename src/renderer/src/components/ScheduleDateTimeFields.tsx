import type { ReactElement } from 'react'
import { formatScheduleDateLabel } from '../posts/datetime'

export default function ScheduleDateTimeFields({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  noTime,
  onNoTimeChange,
  disabled = false,
  idPrefix = 'sched',
  showDateError = false
}: {
  dateValue: string
  timeValue: string
  onDateChange: (dateYmd: string) => void
  onTimeChange: (timeHm: string) => void
  noTime: boolean
  onNoTimeChange: (noTime: boolean) => void
  disabled?: boolean
  idPrefix?: string
  showDateError?: boolean
}): ReactElement {
  const timeDisabled = disabled || noTime
  return (
    <div className="sched-dt-row">
      <label className="sched-dt-field">
        <span className="label">
          Date <span className="pcf-required" aria-hidden="true">*</span>
        </span>
        <div
          className={[
            'sched-dt-date-wrap',
            showDateError && !dateValue ? 'sched-dt-date-wrap--error' : '',
            disabled ? 'sched-dt-date-wrap--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            className={['sched-dt-date-faux', !dateValue ? 'sched-dt-date-faux--empty' : '']
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          >
            <span
              className="sched-dt-date-faux__text"
              title={dateValue ? formatScheduleDateLabel(dateValue) : undefined}
            >
              {dateValue ? formatScheduleDateLabel(dateValue) : 'Select date'}
            </span>
            <span className="sched-dt-date-faux__icon" aria-hidden />
          </div>
          <input
            id={`${idPrefix}-date`}
            className="sched-dt-date-native"
            type="date"
            value={dateValue}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={disabled}
            aria-invalid={showDateError}
            aria-describedby={showDateError ? `${idPrefix}-date-err` : undefined}
          />
        </div>
        {showDateError && (
          <span id={`${idPrefix}-date-err`} className="pcf-error-msg" role="alert">
            Date is required
          </span>
        )}
      </label>
      <div className="sched-dt-field sched-dt-time-col">
        <span className="label">Time</span>
        <div className="sched-dt-time-inline">
          <input
            id={`${idPrefix}-time`}
            type="time"
            className="sched-dt-time-input"
            value={noTime ? '' : timeValue}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={timeDisabled}
          />
          <label className="sched-dt-no-time">
            <input
              id={`${idPrefix}-no-time`}
              type="checkbox"
              checked={noTime}
              disabled={disabled}
              onChange={(e) => onNoTimeChange(e.target.checked)}
            />
            <span>No time</span>
          </label>
        </div>
      </div>
    </div>
  )
}
