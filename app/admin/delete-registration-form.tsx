"use client";

import { Trash2 } from "lucide-react";

export function DeleteRegistrationForm({ registrationId, fullName }: { registrationId: string; fullName: string }) {
  return <form action="/api/admin/registrations/delete" method="post" onSubmit={(event) => {
    if (!window.confirm(`آیا از حذف ثبت‌نام «${fullName}» مطمئن هستید؟`)) event.preventDefault();
  }}>
    <input type="hidden" name="registrationId" value={registrationId} />
    <button className="decision-button delete" type="submit"><Trash2 /> حذف</button>
  </form>;
}
