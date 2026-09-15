/* global React, API, UI */
/* =====================================================================
   users.jsx — 관리자 계정 관리 (최고관리자 전용) + 내 비밀번호 변경
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const { Modal, useConfirm, Field, Text, Select, Loading, Empty, toast, fmtDate } = UI;

const ROLE_LABEL = { super: "최고관리자", staff: "운영자", viewer: "읽기전용" };

function UserEditor({ item, onClose, onSaved }) {
  const [f, setF] = useState({ email: "", name: "", role: "staff", password: "", ...item });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      if (item.id) {
        const body = { name: f.name, role: f.role };
        if (f.password) body.password = f.password;
        await API.admin.userUpdate(item.id, body);
      } else {
        await API.admin.userCreate({ email: f.email, name: f.name, role: f.role, password: f.password });
      }
      onSaved(); onClose(); toast.ok("저장했습니다.");
    } catch (e) { toast.err(e); } finally { setBusy(false); }
  };

  return (
    <Modal title={item.id ? "계정 수정" : "계정 추가"} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn btn--pri" disabled={busy} onClick={save}>저장</button>
      </>}>
      <Field label="이메일 (로그인 ID)">
        <input type="email" value={f.email} disabled={!!item.id}
               onChange={(e) => set("email")(e.target.value)} />
      </Field>
      <Field label="이름"><Text value={f.name} onChange={set("name")} /></Field>
      <Field label="권한" hint="최고관리자: 전체 · 운영자: 콘텐츠/견적 관리 · 읽기전용: 조회만">
        <Select value={f.role} onChange={set("role")}
          options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
      </Field>
      <Field label={item.id ? "새 비밀번호 (변경할 때만 입력)" : "비밀번호"} hint="8자 이상">
        <input type="password" value={f.password || ""} onChange={(e) => set("password")(e.target.value)} autoComplete="new-password" />
      </Field>
    </Modal>
  );
}

function MyPassword({ onClose }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (next !== next2) return toast.err("새 비밀번호가 서로 다릅니다.");
    setBusy(true);
    try { await API.auth.password(cur, next); toast.ok("비밀번호를 변경했습니다."); onClose(); }
    catch (e) { toast.err(e); } finally { setBusy(false); }
  };

  return (
    <Modal title="내 비밀번호 변경" onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>취소</button>
        <button className="btn btn--pri" disabled={busy} onClick={save}>변경</button>
      </>}>
      <Field label="현재 비밀번호"><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
      <Field label="새 비밀번호" hint="8자 이상"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
      <Field label="새 비밀번호 확인"><input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} /></Field>
    </Modal>
  );
}

function Users({ me }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);
  const [pw, setPw] = useState(false);
  const [confirm, confirmNode] = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    API.admin.users().then((d) => setItems(d.items)).catch(toast.err).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const toggleActive = async (u) => {
    try { await API.admin.userUpdate(u.id, { active: u.active ? 0 : 1 }); load(); }
    catch (e) { toast.err(e); }
  };
  const remove = async (u) => {
    if (!(await confirm(`"${u.name}" 계정을 삭제할까요?`, { danger: true, okLabel: "삭제" }))) return;
    try { await API.admin.userDelete(u.id); load(); toast.ok("삭제했습니다."); }
    catch (e) { toast.err(e); }
  };

  const isSuper = me.role === "super";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {confirmNode}
      <div className="card">
        <div className="card__hd">
          <h2>관리자 계정</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn--sm" onClick={() => setPw(true)}>내 비밀번호 변경</button>
          {isSuper ? <button className="btn btn--pri" onClick={() => setEdit({})}>+ 계정 추가</button> : null}
        </div>
        <div className="card__bd card__bd--flush">
          {!isSuper ? (
            <Empty label="계정 목록은 최고관리자만 볼 수 있습니다." />
          ) : loading ? <Loading /> : (
            <table className="tbl">
              <thead>
                <tr><th>이름</th><th>이메일</th><th style={{ width: 110 }}>권한</th>
                  <th style={{ width: 90 }}>상태</th><th style={{ width: 150 }}>최근 로그인</th><th style={{ width: 140 }} /></tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b>{u.id === me.id ? <span className="small muted"> (나)</span> : null}</td>
                    <td className="mono small">{u.email}</td>
                    <td><span className="badge badge--muted">{ROLE_LABEL[u.role]}</span></td>
                    <td>{u.active
                      ? <span className="badge badge--won">사용중</span>
                      : <span className="badge badge--lost">중지</span>}</td>
                    <td className="small muted">{u.last_login_at ? fmtDate(u.last_login_at) : "없음"}</td>
                    <td>
                      <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                        <button className="btn btn--sm" onClick={() => setEdit(u)}>수정</button>
                        <button className="btn btn--sm" onClick={() => toggleActive(u)}>{u.active ? "중지" : "사용"}</button>
                        <button className="btn btn--sm btn--danger" onClick={() => remove(u)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {edit ? <UserEditor item={edit} onClose={() => setEdit(null)} onSaved={load} /> : null}
      {pw ? <MyPassword onClose={() => setPw(false)} /> : null}
    </div>
  );
}

window.Users = Users;
