import React, { useEffect, useRef, useState } from "react";
import { Modal } from "./UI";
import { AuthPage } from "../pages/Account";
import { useMarket } from "../lib/context";

export function AdminEntry() {
  const { session, navigate, path } = useMarket();
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const clear = () => {
    clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      clear();
      if (session) navigate("/admin");
      else setOpen(true);
    }, 5000);
  };
  useEffect(() => clear, []);
  useEffect(() => {
    setOpen(false);
    clear();
  }, [path]);
  return (
    <>
      <button
        type="button"
        className="copyright-entry"
        aria-label="Copyright"
        onPointerDown={(e) => {
          if (e.button === 0) start();
        }}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ([" ", "Enter"].includes(e.key)) {
            e.preventDefault();
            start();
          }
        }}
        onKeyUp={clear}
        onBlur={clear}
      >
        ©
      </button>
      {open && (
        <Modal title="Administrator sign in" onClose={() => setOpen(false)}>
          <div className="admin-signin">
            <AuthPage returnTo="/admin" />
          </div>
        </Modal>
      )}
    </>
  );
}
