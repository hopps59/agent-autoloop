// A phone message supplies task data only; the trusted rule chooses the worker, directory and access.
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import path from "node:path";
export function mobileTask(event: Record<string, unknown>, owner: string) {
  if (event.chat_type !== "p2p" || event.sender_type !== "user" || event.sender_id !== owner) return null;
  if (
    event.message_type !== "text" ||
    typeof event.message_id !== "string" ||
    !/^om_[A-Za-z0-9_-]{1,97}$/.test(event.message_id)
  )
    return null;
  if (typeof event.content !== "string") return null;
  const detail = event.content.trim();
  if (!detail || detail.length > 4000) return null;
  return {
    id: event.message_id,
    type: "mobile.task",
    subject: event.message_id,
    summary: detail.slice(0, 200),
    detail,
  };
}

export function mobileInbox(dir: string) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const fileOf = (id: string) => path.join(dir, `${id}.json`);
  return {
    save(task: NonNullable<ReturnType<typeof mobileTask>>) {
      const file = fileOf(task.id);
      const temporary = `${file}.${process.pid}.tmp`;
      const fd = openSync(temporary, "w", 0o600);
      try {
        writeSync(fd, JSON.stringify(task));
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      renameSync(temporary, file);
    },
    pending() {
      return readdirSync(dir)
        .filter((name) => /^om_[A-Za-z0-9_-]+\.json$/.test(name))
        .map(
          (name) =>
            JSON.parse(readFileSync(path.join(dir, name), "utf8")) as NonNullable<ReturnType<typeof mobileTask>>,
        );
    },
    done(id: string) {
      unlinkSync(fileOf(id));
    },
  };
}
