export default function AlarmModal({ alarm, onClose }) {
  if (!alarm.open) return null;
  return (
    <div className="alovo open">
      <div className="albx">
        <div className="alico">🔔</div>
        <div className="altit">{alarm.title}</div>
        <div className="almsg">{alarm.msg}</div>
        <button className="albtn" onClick={onClose}>Got it! 💪</button>
      </div>
    </div>
  );
}
