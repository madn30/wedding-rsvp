import { useState, useCallback } from 'react';
import { useEventContext } from '../context/EventContext';

export type PriorityLevel = 'Low' | 'Normal' | 'High' | 'Urgent';
export type RecipientGroup = 'All' | 'Staff' | 'VIP';
export type ReminderOffset = 5 | 15 | 30 | 60;

export interface EventFormData {
  title: string;
  date: string;
  startTime: string;
  reminderOffset: ReminderOffset;
  priority: PriorityLevel;
  recipientGroup: RecipientGroup;
  description: string;
  location: string;
}

export interface SentMessage extends EventFormData {
  id: string;
  sentAt: string;
}

export interface ValidationErrors {
  title?: string;
  date?: string;
  startTime?: string;
  description?: string;
  location?: string;
}

const INITIAL_FORM: EventFormData = {
  title: '',
  date: '',
  startTime: '',
  reminderOffset: 15,
  priority: 'Normal',
  recipientGroup: 'All',
  description: '',
  location: '',
};

const ALL_FIELDS = Object.keys(INITIAL_FORM) as (keyof EventFormData)[];

function validate(form: EventFormData): ValidationErrors {
  const e: ValidationErrors = {};

  if (!form.title.trim()) {
    e.title = 'שם האירוע הוא שדה חובה';
  } else if (form.title.trim().length < 3) {
    e.title = 'שם קצר מדי — לפחות 3 תווים';
  }

  if (!form.date) {
    e.date = 'תאריך הוא שדה חובה';
  }

  if (!form.startTime) {
    e.startTime = 'שעת התחלה היא שדה חובה';
  }

  if (form.description.length > 500) {
    e.description = `תיאור ארוך מדי — ${form.description.length}/500 תווים`;
  }

  if (form.location.startsWith('http')) {
    try {
      new URL(form.location);
    } catch {
      e.location = 'כתובת URL לא תקינה';
    }
  }

  return e;
}

export const useEventManager = () => {
  const { createEvent } = useEventContext();

  const [form, setForm] = useState<EventFormData>(INITIAL_FORM);
  const [messages, setMessages] = useState<SentMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<keyof EventFormData>>(new Set());

  const handleChange = useCallback(<K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K]
  ) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      setErrors(validate(next));
      return next;
    });
    setTouched(prev => new Set([...prev, key]));
  }, []);

  const handleBlur = useCallback((key: keyof EventFormData) => {
    setTouched(prev => new Set([...prev, key]));
    setErrors(prev => ({ ...prev, ...validate(form) }));
  }, [form]);

  const fieldError = useCallback((key: keyof ValidationErrors): string | undefined => {
    return touched.has(key) ? errors[key] : undefined;
  }, [errors, touched]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(new Set(ALL_FIELDS));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const created = await createEvent({
        name: form.title,
        date: form.date,
        startTime: form.startTime,
        location: form.location,
        description: form.description,
      });
      const newMessage: SentMessage = {
        ...form,
        id: created._id,
        sentAt: created.createdAt,
      };
      setMessages(prev => [newMessage, ...prev]);
      setForm(INITIAL_FORM);
      setErrors({});
      setTouched(new Set());
    } finally {
      setIsSubmitting(false);
    }
  }, [form, createEvent]);

  return {
    form,
    messages,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    fieldError,
  };
};
