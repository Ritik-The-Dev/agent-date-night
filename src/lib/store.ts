import { useEffect, useSyncExternalStore } from "react";
import { PEOPLE, type Person } from "./people";

const KEY = "agentic-dating-custom";
let custom: Person[] = [];
let snapshot: Person[] = PEOPLE;
const subs = new Set<() => void>();
let loaded = false;

function emit() {
  snapshot = [...PEOPLE, ...custom];
  subs.forEach((f) => f());
}
export function addPerson(p: Person) {
  custom = [...custom.filter((c) => c.id !== p.id), p];
  localStorage.setItem(KEY, JSON.stringify(custom));
  emit();
}
export function removePerson(id: string) {
  custom = custom.filter((c) => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(custom));
  emit();
}
export function useRoster() {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    try { custom = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { custom = []; }
    emit();
  }, []);
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => snapshot,
    () => PEOPLE,
  );
}
