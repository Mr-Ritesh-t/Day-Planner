import { useEffect } from 'react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isOpen]);

  if (!isOpen) return (
    <>
      <div className="bs-over"></div>
      <div className="bs-cont"></div>
    </>
  );

  return (
    <>
      <div className="bs-over on" onClick={onClose}></div>
      <div className="bs-cont on">
        <div className="bs-card">
          <div className="bs-h" onClick={onClose}></div>
          {title && <div className="bs-title">{title}</div>}
          <div className="bs-body">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
