import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
 import.meta.env.VITE_SUPABASE_URL,
 import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
window.storage = {
 async get(key, shared) {
 if (!shared) {
 const raw = localStorage.getItem(key)
 if (raw === null) throw new Error('not found')
 return { key, value: raw, shared: false }
 }
 const { data, error } = await supabase
 .from('kv_store').select('value').eq('key', key).maybeSingle()
 if (error) throw error
 if (!data) throw new Error('not found')
 return { key, value: data.value, shared: true }
 },
 async set(key, value, shared) {
 if (!shared) {
 localStorage.setItem(key, value)
 return { key, value, shared: false }
 }
 const { error } = await supabase.from('kv_store').upsert({ key, value })
 if (error) throw error
 return { key, value, shared: true }
 },
 async delete(key, shared) {
 if (!shared) {
 localStorage.removeItem(key)
 return { key, deleted: true, shared: false }
 }
 const { error } = await supabase.from('kv_store').delete().eq('key', key)
 if (error) throw error
 return { key, deleted: true, shared: true }
 },
 async list(prefix, shared) {
 if (!shared) {
 const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix))
 return { keys, prefix, shared: false }
 }
 let query = supabase.from('kv_store').select('key')
 if (prefix) query = query.like('key', `${prefix}%`)
 const { data, error } = await query
 if (error) throw error
 return { keys: data.map(d => d.key), prefix, shared: true }
 }
}

window.timeEntries = {
  async list() {
    const all = []
    const size = 1000 // Supabase returns at most 1000 rows per request
    for (let from = 0; ; from += size) {
      const { data, error } = await supabase
        .from('time_entries').select('*')
        .order('created_at', { ascending: false })
        .range(from, from + size - 1)
      if (error) throw error
      all.push(...data)
      if (data.length < size) break
    }
    return all.map(fromRow)
  },
  async upsert(entries) {
    for (let i = 0; i < entries.length; i += 200) {
      const { error } = await supabase.from('time_entries').upsert(entries.slice(i, i + 200).map(toRow))
      if (error) throw error
    }
  },
  async remove(ids) {
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await supabase.from('time_entries').delete().in('id', ids.slice(i, i + 100))
      if (error) throw error
    }
  },
}

window.pushSubs = {
  async save(employee, sub) {
    const json = sub.toJSON()
    const del = await supabase.from('push_subscriptions').delete().eq('endpoint', json.endpoint)
    if (del.error) throw del.error
    const { error } = await supabase.from('push_subscriptions').insert({ endpoint: json.endpoint, employee, subscription: json })
    if (error) throw error
  },
}

const toRow = (e) => ({
  id: e.id,
  employee: e.employee,
  project: e.project,
  description: e.description || '',
  justification: e.justification || '',
  entry_date: e.date,
  minutes: e.minutes,
  created_at: e.createdAt,
})
const fromRow = (r) => ({
  id: r.id,
  employee: r.employee,
  project: r.project || '',
  description: r.description || '',
  justification: r.justification || '',
  date: r.entry_date,
  minutes: r.minutes,
  createdAt: new Date(r.created_at).toISOString(),
})