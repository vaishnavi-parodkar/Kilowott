import { ATTRIBUTE_SUGGESTIONS } from '../data/seedProducts.js';
import { Button, inputClass } from './ui.jsx';
import { PlusIcon, XIcon } from './icons.jsx';

/** Dynamic key/value attribute rows. Every product can have a different set. */
export default function AttributeEditor({ attributes, errors, onChange }) {
  const update = (index, patch) => onChange(attributes.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  const remove = (index) => onChange(attributes.filter((_, i) => i !== index));
  const add = (key = '') => onChange([...attributes, { key, value: '' }]);

  const used = new Set(attributes.map((a) => a.key.trim().toLowerCase()));
  const unusedSuggestions = ATTRIBUTE_SUGGESTIONS.filter((s) => !used.has(s.toLowerCase()));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Attributes</span>
        <Button size="sm" variant="secondary" onClick={() => add()}><PlusIcon className="h-4 w-4" /> Add attribute</Button>
      </div>

      {attributes.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
          No attributes yet. Add details like Brand, Color or RAM — each product can have its own set.
        </p>
      )}

      <ul className="space-y-2">
        {attributes.map((attr, i) => (
          <li key={i}>
            <div className="flex items-start gap-2">
              <input
                aria-label={`Attribute ${i + 1} name`}
                list="attribute-suggestions"
                placeholder="Name (e.g. Color)"
                value={attr.key}
                onChange={(e) => update(i, { key: e.target.value })}
                className={`${inputClass(!!errors[`attributes.${i}`])} w-2/5`}
              />
              <input
                aria-label={`Attribute ${i + 1} value`}
                placeholder="Value (e.g. Black)"
                value={attr.value}
                onChange={(e) => update(i, { value: e.target.value })}
                className={inputClass(!!errors[`attributes.${i}`])}
              />
              <button type="button" onClick={() => remove(i)} className="mt-1.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" aria-label={`Remove attribute ${i + 1}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {errors[`attributes.${i}`] && <p className="mt-1 text-xs text-red-600" role="alert">{errors[`attributes.${i}`]}</p>}
          </li>
        ))}
      </ul>

      <datalist id="attribute-suggestions">
        {ATTRIBUTE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
      </datalist>

      {unusedSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Quick add:</span>
          {unusedSuggestions.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:border-brand-500 hover:text-brand-700">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
