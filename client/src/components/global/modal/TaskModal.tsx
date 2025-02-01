import React, { useCallback, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Bold, Italic, List as ListIcon, AlignLeft } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';

const today = new Date();
today.setHours(0, 0, 0, 0);

const validationSchema = Yup.object({
  title: Yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must be less than 50 characters'),
  description: Yup.string()
    .max(500, 'Description must be less than 500 characters'),
  category: Yup.string()
    .required('Category is required')
    .oneOf(['Work', 'Personal'], 'Invalid category'),
    dueDate: Yup.date()
    .required("Due date is required")
    .min(today, "Due date cannot be in the past"),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['TO-DO', 'IN-PROGRESS', 'COMPLETED'], 'Invalid status'),
  files: Yup.array()
    .of(
      Yup.mixed()
        .test('fileSize', 'File too large', (value) => {
          if (!value) return true;
          return value.size <= 5000000; // 5MB
        })
    )
});

const TaskModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, // Add this prop for editing
  mode = 'create' // 'create' or 'edit'
}) => {
  const editor = useEditor({
    extensions: [StarterKit, BoldExtension, ItalicExtension],
    content: initialData?.description || '',
    onUpdate: ({ editor }) => {
      formik.setFieldValue('description', editor.getHTML());
    }
  });

  const initialValues = {
    title: '',
    description: '',
    category: 'Work',
    dueDate: '',
    status: '',
    files: [],
    ...initialData // Spread initial data if provided
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true, // Important for handling edits
    onSubmit: async (values) => {
      await onSubmit(values);
      resetForm();
      onClose();
    }
  });

  // Update editor content when initialData changes
  useEffect(() => {
    if (editor && initialData?.description) {
      editor.commands.setContent(initialData.description);
    }
  }, [editor, initialData]);

  const resetForm = () => {
    formik.resetForm();
    editor?.commands.setContent('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = [...e.dataTransfer.files];
    formik.setFieldValue('files', [...formik.values.files, ...droppedFiles]);
  }, [formik]);

  const handleFileUpload = (e) => {
    const uploadedFiles = [...e.target.files];
    formik.setFieldValue('files', [...formik.values.files, ...uploadedFiles]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      resetForm();
      onClose();
    }}>
      <DialogContent className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? 'Create Task' : 'Edit Task'}
          </h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <input
              name="title"
              placeholder="Task title"
              {...formik.getFieldProps('title')}
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 
                ${formik.touched.title && formik.errors.title ? 'border-red-500' : 'border-gray-200'}`}
            />
            {formik.touched.title && formik.errors.title && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.title}</div>
            )}
          </div>

          <div className="border border-gray-200 rounded-md">
            <div className="flex gap-2 p-2 border-b">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('bold') ? 'bg-gray-100' : ''}`}
              >
                <Bold className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('italic') ? 'bg-gray-100' : ''}`}
              >
                <Italic className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('bulletList') ? 'bg-gray-100' : ''}`}
              >
                <ListIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={`p-1.5 hover:bg-gray-100 rounded ${editor?.isActive('paragraph') ? 'bg-gray-100' : ''}`}
              >
                <AlignLeft className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <EditorContent 
              editor={editor} 
              className="w-full min-h-[100px] p-3 text-sm focus:outline-none"
            />
            <div className="text-xs text-gray-400 text-right p-2">
              {editor?.storage.characterCount?.characters()}/500 characters
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Task Category*</label>
              <div className="flex gap-2">
                {['Work', 'Personal'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => formik.setFieldValue('category', cat)}
                    className={`flex-1 py-1 px-3 rounded-md text-sm border ${
                      formik.values.category === cat 
                        ? 'bg-purple-600 text-white border-purple-600' 
                        : 'border-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {formik.touched.category && formik.errors.category && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.category}</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm mb-2">Due on*</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  onFocus={(e) => e.target.type = 'date'}
                  onBlur={(e) => {
                    e.target.type = 'text';
                    formik.handleBlur(e);
                  }}
                  {...formik.getFieldProps('dueDate')}
                  className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500
                    ${formik.touched.dueDate && formik.errors.dueDate ? 'border-red-500' : 'border-gray-200'}`}
                />
                {formik.touched.dueDate && formik.errors.dueDate && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.dueDate}</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Task Status*</label>
            <select 
              {...formik.getFieldProps('status')}
              className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white
                ${formik.touched.status && formik.errors.status ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value="">Choose</option>
              <option value="TO-DO">TO-DO</option>
              <option value="IN-PROGRESS">IN-PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            {formik.touched.status && formik.errors.status && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.status}</div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-2">Attachment</label>
            <div 
              className="border border-dashed border-gray-200 rounded-md p-4 text-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <p className="text-sm text-gray-500">
                Drop your files here or{' '}
                <label htmlFor="file-upload" className="text-purple-600 cursor-pointer">
                  Upload
                </label>
              </p>
              {formik.values.files.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {formik.values.files.length} file(s) selected
                </div>
              )}
              {formik.touched.files && formik.errors.files && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.files}</div>
              )}
            </div>
          </div>

         <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm hover:bg-gray-50 rounded-md"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
            disabled={formik.isSubmitting}
          >
            {mode === 'create' ? 'CREATE' : 'SAVE'}
          </button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;