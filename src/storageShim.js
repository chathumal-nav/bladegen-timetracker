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
