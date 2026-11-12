export const apiKeyScopes = [
  { value: 'hr:events:write', label: 'HR-események beküldése' },
  { value: 'hr:events:read', label: 'Feldolgozási állapot lekérdezése' },
];

export function scopeLabel(scope: string): string {
  return apiKeyScopes.find(item => item.value === scope)?.label ?? scope;
}
