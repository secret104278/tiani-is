# Shared Form Components

Reusable, type-safe form components with consistent styling and validation error display.

## Components

### FormField

Generic wrapper for any form field with label and error display.

```tsx
import { FormField } from "~/components/Form/shared";

<FormField
  label="姓名"
  required
  error={errors.name?.message}
  description="請輸入您的真實姓名"
>
  <input
    type="text"
    className="input input-bordered"
    {...register("name")}
  />
</FormField>
```

### DateTimeField

Specialized component for datetime-local inputs.

```tsx
import { DateTimeField } from "~/components/Form/shared";

<DateTimeField
  label="開始時間"
  required
  error={errors.startDateTime?.message}
  {...register("startDateTime", { valueAsDate: true })}
/>
```

### NumberField

Specialized component for number inputs with proper mobile keyboard.

```tsx
import { NumberField } from "~/components/Form/shared";

// Integer input
<NumberField
  label="人數"
  required
  error={errors.headcount?.message}
  {...register("headcount", { valueAsNumber: true })}
/>

// Decimal input
<NumberField
  label="預估時數"
  required
  step="0.1"
  inputMode="decimal"
  error={errors.duration?.message}
  {...register("duration", { valueAsNumber: true })}
/>
```

### FormError

Component for displaying form-level or mutation errors.

```tsx
import { FormError } from "~/components/Form/shared";

<FormError error={error} />
```

## Benefits

- ✅ **Consistent styling** - All fields look the same
- ✅ **Automatic error display** - Pass error prop and it renders
- ✅ **Required indicators** - Automatic red asterisk (*)
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Accessible** - Proper label associations
- ✅ **Mobile-friendly** - Correct inputMode for keyboards
- ✅ **Less boilerplate** - DRY principle

## Migration Example

### Before

```tsx
<div>
  <label className="label">
    <span className="label-text">
      人數
      <span className="text-error ml-1">*</span>
    </span>
  </label>
  <input
    type="number"
    inputMode="numeric"
    className="tiani-input"
    {...register("headcount", { valueAsNumber: true })}
  />
  {errors.headcount && (
    <label className="label">
      <span className="label-text-alt text-error">
        {errors.headcount.message}
      </span>
    </label>
  )}
</div>
```

### After

```tsx
<NumberField
  label="人數"
  required
  error={errors.headcount?.message}
  {...register("headcount", { valueAsNumber: true })}
/>
```

**Result:** 16 lines → 5 lines (69% reduction!)

## Future Usage

All new forms should use these components for consistency and maintainability.
