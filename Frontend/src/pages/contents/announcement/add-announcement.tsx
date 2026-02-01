import { barangays } from '@/config/constant';
import { auth } from '@/lib/firebaseConfig';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tooltip,
  type Selection,
} from '@heroui/react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Tiptap, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import DOMPurify from 'dompurify';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RotateCcw,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ComponentProps } from 'react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlign: {
      setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType;
      unsetTextAlign: () => ReturnType;
    };
  }
}

const ImageNode = Node.create({
  name: 'image',
  inline: false,
  group: 'block',
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'img[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { class: 'max-w-full rounded-lg' })];
  },
});

const TextAlign = Extension.create({
  name: 'textAlign',
  addOptions() {
    return {
      types: ['heading', 'paragraph'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.textAlign || null,
            renderHTML: attributes => {
              if (!attributes.textAlign) {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextAlign:
        alignment =>
        ({ commands }) =>
          this.options.types.some((type: string) => commands.updateAttributes(type, { textAlign: alignment })),
      unsetTextAlign:
        () =>
        ({ commands }) =>
          this.options.types.some((type: string) => commands.resetAttributes(type, 'textAlign')),
    };
  },
});

type ToolButtonProps = {
  tooltip: string;
} & ComponentProps<typeof Button>;

const ToolButton = ({ tooltip, isDisabled, ...props }: ToolButtonProps) => (
  <Tooltip content={tooltip} placement="top" delay={150}>
    <span className={`inline-flex ${isDisabled ? 'cursor-not-allowed' : ''}`}>
      <Button {...props} isDisabled={isDisabled} />
    </span>
  </Tooltip>
);

const announcementCategories = [
  { key: 'general', label: 'General' },
  { key: 'event', label: 'Event' },
  { key: 'update', label: 'Update' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'alert', label: 'Alert' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'other', label: 'Other' },
];

const serializeSelection = (selection: Selection): string[] => {
  if (selection === 'all') {
    return ['all'];
  }
  return Array.from(selection).map(String);
};

const AddAnnouncement = () => {
  const initialContent = '<p>Write your announcement here...</p>';
  const richTextClass =
    'text-sm leading-relaxed text-foreground [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-default-600 dark:[&_blockquote]:border-default-500 dark:[&_blockquote]:text-default-400 [&_code]:rounded [&_code]:bg-default-100 [&_code]:px-1 [&_pre]:my-3 [&_pre]:rounded-lg [&_pre]:bg-default-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:leading-relaxed dark:[&_code]:bg-default-50 dark:[&_pre]:bg-default-50';
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Selection>(new Set(['general']));
  const [selectedBarangays, setSelectedBarangays] = useState<Selection>(new Set());
  const user = auth.currentUser;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      ImageNode,
      TextAlign,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: `min-h-[320px] w-full rounded-xl border border-default-200 bg-content1 px-4 py-3 focus:outline-none ${richTextClass}`,
      },
    },
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      underline: editor?.isActive('underline') ?? false,
      strike: editor?.isActive('strike') ?? false,
      code: editor?.isActive('code') ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      blockquote: editor?.isActive('blockquote') ?? false,
      heading1: editor?.isActive('heading', { level: 1 }) ?? false,
      heading2: editor?.isActive('heading', { level: 2 }) ?? false,
      alignLeft: editor?.isActive({ textAlign: 'left' }) ?? false,
      alignCenter: editor?.isActive({ textAlign: 'center' }) ?? false,
      alignRight: editor?.isActive({ textAlign: 'right' }) ?? false,
      alignJustify: editor?.isActive({ textAlign: 'justify' }) ?? false,
      link: editor?.isActive('link') ?? false,
    }),
  });

  const sanitizedContent = useEditorState({
    editor,
    selector: ({ editor }) => DOMPurify.sanitize(editor?.getHTML() ?? ''),
  });

  // Use sanitizedContentRef.current when sending to the backend.
  const sanitizedContentRef = useRef('');

  useEffect(() => {
    sanitizedContentRef.current = sanitizedContent;
  }, [sanitizedContent]);

  const previewText = editor?.getText().trim() ?? '';
  const isPreviewEmpty = previewText.length === 0 || previewText === 'Write your announcement here...';
  const thumbnailPreview = thumbnailDataUrl;
  const selectedCategoryKey = serializeSelection(selectedCategory)[0] ?? 'general';
  const selectedCategoryLabel =
    announcementCategories.find(category => category.key === selectedCategoryKey)?.label ?? 'General';
  const selectedBarangayValues = serializeSelection(selectedBarangays);
  const selectedBarangayLabels = selectedBarangayValues.map(
    value => barangays.find(barangay => barangay.value === value)?.label ?? value
  );

  const draftLoadedRef = useRef(false);

  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setThumbnailDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetDraft = () => {
    localStorage.removeItem('announcementDraft');
    setSelectedCategory(new Set(['general']));
    setSelectedBarangays(new Set());
    setThumbnailDataUrl('');
    editor?.commands.setContent(initialContent);
  };

  const buildAnnouncementPayload = () => {
    const sanitizedHtml = DOMPurify.sanitize(editor?.getHTML() ?? '');
    return {
      content: sanitizedHtml,
      category: selectedCategoryKey,
      barangays: selectedBarangayValues,
      thumbnail: thumbnailDataUrl,
    };
  };

  const handlePublish = async () => {
    const payload = buildAnnouncementPayload();
    console.log('Publishing announcement with payload:', payload);

    if (!user) return;

    try {
      const token = await user?.getIdToken();
      const response = await axios.post('/api/announcements', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Announcement published successfully:', response.data);
      if (response.status === 201) {
        localStorage.removeItem('announcementDraft');
      }
    } catch (error) {
      console.error('Error publishing announcement:', error);
    }
  };

  useEffect(() => {
    if (!editor || draftLoadedRef.current) return;
    const savedDraft = localStorage.getItem('announcementDraft');
    if (!savedDraft) {
      draftLoadedRef.current = true;
      return;
    }
    try {
      const draft = JSON.parse(savedDraft) as {
        content?: string;
        category?: string;
        barangays?: string[];
        thumbnail?: string;
      };

      if (draft.content) {
        editor.commands.setContent(draft.content);
      }
      if (draft.category) {
        setSelectedCategory(new Set([draft.category]));
      }
      if (Array.isArray(draft.barangays)) {
        setSelectedBarangays(new Set(draft.barangays));
      }
      if (draft.thumbnail) {
        setThumbnailDataUrl(draft.thumbnail);
      }
    } catch (error) {
      console.error('Failed to load announcement draft:', error);
    } finally {
      draftLoadedRef.current = true;
    }
  }, [editor]);

  useEffect(() => {
    if (!draftLoadedRef.current) return;
    const [categoryKey] = serializeSelection(selectedCategory);
    const draftPayload = {
      content: sanitizedContent,
      category: categoryKey || 'general',
      barangays: serializeSelection(selectedBarangays),
      thumbnail: thumbnailDataUrl,
    };
    localStorage.setItem('announcementDraft', JSON.stringify(draftPayload));
  }, [sanitizedContent, selectedCategory, selectedBarangays, thumbnailDataUrl]);

  const handleAddImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src: url } })
      .run();
  };

  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter a URL', previousUrl || '');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim(), target: '_blank' }).run();
  };

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div>
        <p className="text-3xl font-bold">Add Announcement</p>
        <p className="text-sm text-default-500">Compose your announcement with rich formatting.</p>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-3 items-start">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <ToolButton
                tooltip="Bold"
                isIconOnly
                size="sm"
                variant={toolbarState.bold ? 'solid' : 'flat'}
                color={toolbarState.bold ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleBold().run()}
                isDisabled={!editor?.can().chain().focus().toggleBold().run()}
                aria-label="Bold"
              >
                <Bold size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Italic"
                isIconOnly
                size="sm"
                variant={toolbarState.italic ? 'solid' : 'flat'}
                color={toolbarState.italic ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleItalic().run()}
                isDisabled={!editor?.can().chain().focus().toggleItalic().run()}
                aria-label="Italic"
              >
                <Italic size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Underline"
                isIconOnly
                size="sm"
                variant={toolbarState.underline ? 'solid' : 'flat'}
                color={toolbarState.underline ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleUnderline().run()}
                isDisabled={!editor?.can().chain().focus().toggleUnderline().run()}
                aria-label="Underline"
              >
                <UnderlineIcon size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Strikethrough"
                isIconOnly
                size="sm"
                variant={toolbarState.strike ? 'solid' : 'flat'}
                color={toolbarState.strike ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleStrike().run()}
                isDisabled={!editor?.can().chain().focus().toggleStrike().run()}
                aria-label="Strikethrough"
              >
                <Strikethrough size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Inline code"
                isIconOnly
                size="sm"
                variant={toolbarState.code ? 'solid' : 'flat'}
                color={toolbarState.code ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleCode().run()}
                isDisabled={!editor?.can().chain().focus().toggleCode().run()}
                aria-label="Inline code"
              >
                <Code size={16} />
              </ToolButton>

              <Divider orientation="vertical" className="h-7" />

              <ToolButton
                tooltip="Bullet list"
                isIconOnly
                size="sm"
                variant={toolbarState.bulletList ? 'solid' : 'flat'}
                color={toolbarState.bulletList ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleBulletList().run()}
                aria-label="Bullet list"
              >
                <List size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Numbered list"
                isIconOnly
                size="sm"
                variant={toolbarState.orderedList ? 'solid' : 'flat'}
                color={toolbarState.orderedList ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleOrderedList().run()}
                aria-label="Numbered list"
              >
                <ListOrdered size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Blockquote"
                isIconOnly
                size="sm"
                variant={toolbarState.blockquote ? 'solid' : 'flat'}
                color={toolbarState.blockquote ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleBlockquote().run()}
                aria-label="Blockquote"
              >
                <Quote size={16} />
              </ToolButton>

              <Divider orientation="vertical" className="h-7" />

              <ToolButton
                tooltip="Heading 1"
                isIconOnly
                size="sm"
                variant={toolbarState.heading1 ? 'solid' : 'flat'}
                color={toolbarState.heading1 ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                aria-label="Heading 1"
              >
                <Heading1 size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Heading 2"
                isIconOnly
                size="sm"
                variant={toolbarState.heading2 ? 'solid' : 'flat'}
                color={toolbarState.heading2 ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                aria-label="Heading 2"
              >
                <Heading2 size={16} />
              </ToolButton>

              <Divider orientation="vertical" className="h-7" />

              <ToolButton
                tooltip="Align left"
                isIconOnly
                size="sm"
                variant={toolbarState.alignLeft ? 'solid' : 'flat'}
                color={toolbarState.alignLeft ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().setTextAlign('left').run()}
                aria-label="Align left"
              >
                <AlignLeft size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Align center"
                isIconOnly
                size="sm"
                variant={toolbarState.alignCenter ? 'solid' : 'flat'}
                color={toolbarState.alignCenter ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().setTextAlign('center').run()}
                aria-label="Align center"
              >
                <AlignCenter size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Align right"
                isIconOnly
                size="sm"
                variant={toolbarState.alignRight ? 'solid' : 'flat'}
                color={toolbarState.alignRight ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().setTextAlign('right').run()}
                aria-label="Align right"
              >
                <AlignRight size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Justify"
                isIconOnly
                size="sm"
                variant={toolbarState.alignJustify ? 'solid' : 'flat'}
                color={toolbarState.alignJustify ? 'primary' : 'default'}
                onPress={() => editor?.chain().focus().setTextAlign('justify').run()}
                aria-label="Justify"
              >
                <AlignJustify size={16} />
              </ToolButton>

              <Divider orientation="vertical" className="h-7" />

              <ToolButton
                tooltip="Add link"
                isIconOnly
                size="sm"
                variant={toolbarState.link ? 'solid' : 'flat'}
                color={toolbarState.link ? 'primary' : 'default'}
                onPress={handleSetLink}
                aria-label="Add link"
              >
                <Link2 size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Add image"
                isIconOnly
                size="sm"
                variant="flat"
                onPress={handleAddImage}
                aria-label="Add image"
              >
                <ImagePlus size={16} />
              </ToolButton>

              <Divider orientation="vertical" className="h-7" />

              <ToolButton
                tooltip="Undo"
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => editor?.chain().focus().undo().run()}
                isDisabled={!editor?.can().chain().focus().undo().run()}
                aria-label="Undo"
              >
                <Undo2 size={16} />
              </ToolButton>
              <ToolButton
                tooltip="Redo"
                isIconOnly
                size="sm"
                variant="flat"
                onPress={() => editor?.chain().focus().redo().run()}
                isDisabled={!editor?.can().chain().focus().redo().run()}
                aria-label="Redo"
              >
                <Redo2 size={16} />
              </ToolButton>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="flat"
                color="default"
                startContent={<RotateCcw size={16} />}
                onPress={() => setIsResetOpen(true)}
              >
                Reset
              </Button>
              <Button
                color="primary"
                variant="flat"
                startContent={<Eye size={16} />}
                onPress={() => setIsPreviewOpen(true)}
              >
                Preview
              </Button>
            </div>
          </div>
          <p className="text-xs text-default-500">
            Tip: Use headings, lists, and images to make announcements easy to scan.
          </p>
        </CardHeader>
        <CardBody className="pt-0">
          <Tiptap instance={editor}>
            <Tiptap.Loading>
              <div className="min-h-[320px] rounded-xl border border-default-200 bg-content1 px-4 py-3 text-sm text-default-500">
                Loading editor...
              </div>
            </Tiptap.Loading>
            <Tiptap.BubbleMenu>
              <div className="flex gap-2 rounded-full border border-default-200 bg-white p-1 shadow-md">
                <ToolButton
                  tooltip="Bold"
                  isIconOnly
                  size="sm"
                  variant={toolbarState.bold ? 'solid' : 'flat'}
                  color={toolbarState.bold ? 'primary' : 'default'}
                  onPress={() => editor?.chain().focus().toggleBold().run()}
                  aria-label="Bold"
                >
                  <Bold size={14} />
                </ToolButton>
                <ToolButton
                  tooltip="Italic"
                  isIconOnly
                  size="sm"
                  variant={toolbarState.italic ? 'solid' : 'flat'}
                  color={toolbarState.italic ? 'primary' : 'default'}
                  onPress={() => editor?.chain().focus().toggleItalic().run()}
                  aria-label="Italic"
                >
                  <Italic size={14} />
                </ToolButton>
                <ToolButton
                  tooltip="Underline"
                  isIconOnly
                  size="sm"
                  variant={toolbarState.underline ? 'solid' : 'flat'}
                  color={toolbarState.underline ? 'primary' : 'default'}
                  onPress={() => editor?.chain().focus().toggleUnderline().run()}
                  aria-label="Underline"
                >
                  <UnderlineIcon size={14} />
                </ToolButton>
              </div>
            </Tiptap.BubbleMenu>
            <Tiptap.FloatingMenu>
              <div className="flex gap-2 rounded-full border border-default-200 bg-white p-1 shadow-md">
                <ToolButton
                  tooltip="Heading"
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  aria-label="Heading"
                >
                  <Heading2 size={14} />
                </ToolButton>
                <ToolButton
                  tooltip="Bullet list"
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={() => editor?.chain().focus().toggleBulletList().run()}
                  aria-label="Bullet list"
                >
                  <List size={14} />
                </ToolButton>
              </div>
            </Tiptap.FloatingMenu>
            <Tiptap.Content />
          </Tiptap>
        </CardBody>
      </Card>

      <Modal isOpen={isPreviewOpen} onOpenChange={setIsPreviewOpen} size="full" scrollBehavior="inside">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Announcement Preview</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <Input
                      className="lg:col-span-4"
                      type="file"
                      accept="image/*"
                      label="Upload thumbnail"
                      labelPlacement="outside"
                      size="lg"
                      variant="bordered"
                      onChange={handleThumbnailFileChange}
                    />
                    <Select
                      className="lg:col-span-3"
                      label="Category"
                      labelPlacement="outside"
                      size="lg"
                      variant="bordered"
                      disallowEmptySelection
                      selectedKeys={selectedCategory}
                      onSelectionChange={setSelectedCategory}
                      items={announcementCategories}
                    >
                      {item => <SelectItem key={item.key}>{item.label}</SelectItem>}
                    </Select>
                    <Select
                      className="lg:col-span-5"
                      label="Barangays"
                      labelPlacement="outside"
                      size="lg"
                      variant="bordered"
                      selectionMode="multiple"
                      selectedKeys={selectedBarangays}
                      onSelectionChange={setSelectedBarangays}
                      items={barangays}
                      placeholder="Select barangays"
                    >
                      {item => <SelectItem key={item.value}>{item.label}</SelectItem>}
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip color="primary" variant="flat">
                        {selectedCategoryLabel}
                      </Chip>
                      {selectedBarangayLabels.length > 0 ? (
                        selectedBarangayLabels.map(barangay => (
                          <Chip key={barangay} variant="flat">
                            {barangay}
                          </Chip>
                        ))
                      ) : (
                        <Chip variant="flat">No barangays selected</Chip>
                      )}
                    </div>
                    {thumbnailPreview ? (
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full max-h-64 object-cover rounded-xl border border-default-200"
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed border-default-200 bg-content1 px-4 py-10 text-center text-default-500">
                        No thumbnail selected.
                      </div>
                    )}
                    {isPreviewEmpty ? (
                      <div className="rounded-xl border border-dashed border-default-200 bg-content1 px-4 py-10 text-center text-default-500">
                        Start writing to see a live preview of your announcement.
                      </div>
                    ) : (
                      <div
                        className={`w-full rounded-xl border border-default-200 bg-content1 px-4 py-3 ${richTextClass}`}
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                      />
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onPress={() => {
                    // handlePublish();
                    onClose();
                  }}
                >
                  Publish
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isResetOpen} onOpenChange={setIsResetOpen} size="sm">
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">Reset draft?</ModalHeader>
              <ModalBody>
                This will clear the editor content, thumbnail, category, barangays, and remove the saved draft.
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    handleResetDraft();
                    onClose();
                  }}
                >
                  Reset
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AddAnnouncement;
