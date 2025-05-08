const handlers = {}
export const eventBus = {
  on(event, fn) {
    (handlers[event] ||= []).push(fn)
  },
  off(event, fn) {
    handlers[event] = (handlers[event] || []).filter(f => f !== fn)
  },
  emit(event, data) {
    (handlers[event] || []).forEach(fn => fn(data))
  }
}