import { useState } from 'react';

// Tiny form helper: values, per-field errors, and a bind() shortcut for inputs
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };
  const bind = (name) => ({ value: values[name] ?? '', onChange: (e) => set(name, e.target.value) });

  return { values, errors, setErrors, set, bind };
}
