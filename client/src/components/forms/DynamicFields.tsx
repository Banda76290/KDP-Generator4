import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DynamicFieldsProps<T> {
  label: string;
  fields: T[];
  onFieldsChange: (fields: T[]) => void;
  renderField: (
    field: T,
    index: number,
    updateField: (index: number, newField: T) => void,
    removeField: (index: number) => void
  ) => ReactNode;
  defaultField: T;
  maxFields?: number;
}

export default function DynamicFields<T>({
  label,
  fields,
  onFieldsChange,
  renderField,
  defaultField,
  maxFields = 10
}: DynamicFieldsProps<T>) {
  const addField = () => {
    if (fields.length < maxFields) {
      onFieldsChange([...fields, defaultField]);
    }
  };

  const updateField = (index: number, newField: T) => {
    const newFields = [...fields];
    newFields[index] = newField;
    onFieldsChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{label}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addField}
          disabled={fields.length >= maxFields}
          className="text-primary hover:text-primary/80"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add { label.slice(0, -1 }
        </Button>
      </div>

      <div className="space-y-3">
        { fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="mb-2">No {label.toLowerCase( } added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First { label.slice(0, -1 }
            </Button>
          </div>
        ) : (
          fields.map((field, index) =>
            renderField(field, index, updateField, removeField)
          )
        )}
      </div>
    </div>
  );
}
