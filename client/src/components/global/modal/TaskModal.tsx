import React, { useCallback, useState } from 'react';
import { X, Bold, Italic, List as ListIcon, WrapText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import { FileUpload } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode = 'create',
}) => { 
  const initialFormData = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Work',
    dueDate: initialData?.dueDate || '',
    status: initialData?.status || '',
    files: initialData?.files || [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [view, setView] = useState('details');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const editor = useEditor({
    extensions: [StarterKit, BoldExtension, ItalicExtension],
    content: initialData?.description || '',
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({
        ...prev,
        description: editor.getHTML(),
      }));
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = 'Title is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData(initialFormData);
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const isValidSize = file.size <= 5 * 1024 * 1024; 
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
      return isValidSize && isValidType;
    });

    if (validFiles.length !== droppedFiles.length) {
      alert('Some files were skipped. Files must be under 5MB and in a supported format (images, PDF, DOC).');
    }

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files);
      const validFiles = uploadedFiles.filter(file => {
        const isValidSize = file.size <= 5 * 1024 * 1024; 
        const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
        return isValidSize && isValidType;
      });
  
      if (validFiles.length !== uploadedFiles.length) {
        alert('Some files were skipped. Files must be under 5MB and in a supported format (images, PDF, DOC).');
      }
  
      const fileUrls = await Promise.all(
        validFiles.map(async (file) => {
          const fileRef = ref(storage, `tasks/${file.name}`);
          await uploadBytes(fileRef, file);
          const downloadURL = await getDownloadURL(fileRef);
          return downloadURL; 
        })
      );
  
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...fileUrls]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_: any, i: number) => i !== index)
    }));
  };

  const renderExistingFiles = () => {
    if (!initialData?.files?.length) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Existing Files:</h4>
        <div className="space-y-2">
          {initialData.files.map((file: FileUpload, index: number) => (
            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
              <a 
                href={file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 truncate"
              >
                {file.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent mode={mode} className="min-h-[650px] sm:min-h-96  p-0 gap-0">
        {mode === "edit" && (
          <div className="p-4 border-b mt-8 sm:mt-2 border-gray-100">
            <div className="flex gap-2 sm:hidden w-full bg-gray-100 p-1 rounded-full">
              {["DETAILS", "ACTIVITY"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setView(val.toLowerCase())}
                  className={`flex-1 px-6 py-1.5 rounded-full text-xs font-medium transition-all ${
                    view === val.toLowerCase()
                      ? "bg-black text-white"
                      : "bg-transparent text-gray-600"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row w-full">
          <div className={`p-4 pb-0 ${view === 'details' ? 'block' : 'hidden'} sm:block `}>
            <h2 className="text-lg font-medium sm:mb-4">
              {mode === 'create' ? 'Create Task' : ''}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  name="title"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.title ? 'border-red-500' : 'border-gray-200'
                  } rounded-md bg-gray-50 text-sm focus:outline-none`}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div className="border border-gray-200 bg-gray-50 rounded-md">
                <EditorContent
                  editor={editor}
                  className="w-full md:min-h-[120px] min-h-[80px] p-3 text-sm [&_*:focus]:outline-none"
                />
                {!editor?.getText() && (
                  <span className="absolute sm:top-36 top-44 left-8 text-gray-400 text-sm flex">
                    <WrapText className=" h-4 w-4 mr-1" />
                    Description
                  </span>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 p-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-1 hover:bg-gray-100 rounded ${
                        editor?.isActive('bold') ? 'bg-gray-200' : ''
                      }`}
                    >
                      <Bold className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`p-1 hover:bg-gray-100 rounded ${
                        editor?.isActive('italic') ? 'bg-gray-200' : ''
                      }`}
                    >
                      <Italic className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`p-1 hover:bg-gray-100 rounded ${
                        editor?.isActive('bulletList') ? 'bg-gray-200' : ''
                      }`}
                    >
                      <ListIcon className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-400">
                    {editor?.storage.characterCount?.characters() || 0}/300 characters
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Task Category*
                  </label>
                  <div className="flex gap-2">
                    {['Work', 'Personal'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                        className={`px-6 py-1.5 rounded-2xl text-xs ${
                          formData.category === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Due on*
                  </label>
                  <input
                    name="dueDate"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.dueDate}
                    onChange={handleChange}
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => {
                      e.target.type = 'text';
                    }}
                    className={`md:w-full px-4 py-2 border ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg text-xs focus:outline-none`}
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Task Status*
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={`md:w-full px-4 py-2 border ${
                      errors.status ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg text-xs focus:outline-none appearance-none bg-white`}
                  >
                    <option value="">Choose</option>
                    <option value="TO-DO">TO-DO</option>
                    <option value="IN-PROGRESS">IN-PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Attachment
                </label>
                <div
                  className="border border-dashed border-gray-200 bg-gray-50 rounded-md md:p-4 p-2"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  />
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Drop your files here or{' '}
                      <label
                        htmlFor="file-upload"
                        className="text-purple-600 cursor-pointer hover:text-purple-700"
                      >
                        Upload
                      </label>
                    </p>
                    
                  </div>

                  {formData.files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.files.map((file: File, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {renderExistingFiles()}
                </div>
              </div>
            </form>
          </div>

          {mode === 'edit' && (
            <div className={`border-t sm:border-l border-gray-100 bg-gray-50 p-4 sm:flex-1 ${
              view === 'activity' ? 'block' : 'hidden'
            } sm:block`}>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Activity</h3>
              <div className="space-y-3">
                {initialData?.activities?.map((val: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-start text-xs"
                  >
                    <span className="text-gray-600">{val.action}</span>
                    <span className="text-gray-400">
                      {new Date(val.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`flex justify-end gap-3 p-4 mt-4 border-t border-gray-100 bg-gray-50  ${
              view === 'activity' ? 'hidden' : 'block'}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-medium hover:bg-gray-50 rounded-2xl"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-purple-600 text-white text-xs font-medium rounded-2xl hover:bg-purple-700"
          >
            {mode === 'create' ? 'CREATE' : 'SAVE'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;