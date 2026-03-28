"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  popupClassName?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
};

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      placeholder = "Selecione uma opção",
      disabled = false,
      invalid = false,
      className,
      popupClassName,
      options,
      onValueChange,
    },
    ref,
  ) => {
    const optionsByValue = React.useMemo(
      () =>
        new Map(
          options.map((option) => [
            option.value,
            { label: option.label, description: option.description },
          ]),
        ),
      [options],
    );

    const controlledProps =
      value !== undefined
        ? { value }
        : defaultValue !== undefined
          ? { defaultValue }
          : {};

    return (
      <SelectPrimitive.Root
        name={name}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (typeof nextValue === "string") {
            onValueChange?.(nextValue);
          }
        }}
        {...controlledProps}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          aria-invalid={invalid ? true : undefined}
          className={cn(
            "group flex h-13 w-full items-center gap-3 rounded-xl border bg-surface-emphasis px-4 text-left text-foreground shadow-sm shadow-foreground/5 outline-none transition-interactive hover:border-border-strong hover:bg-surface data-[popup-open]:border-primary data-[popup-open]:bg-surface data-[popup-open]:shadow-md data-[popup-open]:shadow-foreground/10 data-[disabled]:cursor-not-allowed data-[disabled]:bg-surface-muted data-[disabled]:opacity-60 focus-visible:ring-2",
            invalid
              ? "border-danger focus-visible:ring-team-beta-soft"
              : "border-border focus-visible:ring-team-alpha-soft",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder}>
            {(selectedValue: string | null) => {
              const selectedOption = selectedValue ? optionsByValue.get(selectedValue) : null;

              if (!selectedOption) {
                return <span className="truncate text-sm text-muted-foreground">{placeholder}</span>;
              }

              return (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {selectedOption.label}
                  </span>
                  {selectedOption.description ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {selectedOption.description}
                    </span>
                  ) : null}
                </span>
              );
            }}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon className="ml-auto shrink-0 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180">
            <ChevronDownIcon className="size-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={8}>
            <SelectPrimitive.Popup
              className={cn(
                "z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-lg shadow-foreground/10 backdrop-blur-sm transition-all duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
                popupClassName,
              )}
              style={{ width: "var(--anchor-width)" }}
            >
              <SelectPrimitive.List className="max-h-72 overflow-y-auto p-1.5">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    disabled={option.disabled}
                    className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-foreground outline-none transition-colors data-[highlighted]:bg-surface-emphasis data-[selected]:bg-surface data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <SelectPrimitive.ItemText className="block truncate text-sm font-medium">
                        {option.label}
                      </SelectPrimitive.ItemText>
                      {option.description ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      ) : null}
                    </div>
                    <SelectPrimitive.ItemIndicator className="text-team-alpha">
                      <CheckIcon className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);
Select.displayName = "Select";

export { Select };
