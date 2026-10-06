import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function SortSelect({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs text-muted-foreground">Sort</label>
      <NativeSelect id="sort" name="sort" defaultValue={value} className="w-40">
        <NativeSelectOption value="deadline">Deadline: soonest</NativeSelectOption>
        <NativeSelectOption value="newest">Posted: newest</NativeSelectOption>
        <NativeSelectOption value="quantity">Quantity: highest</NativeSelectOption>
      </NativeSelect>
    </div>
  );
}
