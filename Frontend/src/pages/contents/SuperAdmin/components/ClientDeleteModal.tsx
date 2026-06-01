import type { ClientDeletionPreview, ClientLgu } from '@/pages/contents/SuperAdmin/types';
import { formatDateTime } from '@/pages/contents/SuperAdmin/utils';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea } from '@heroui/react';

type ClientDeleteModalProps = {
  client: ClientLgu | null;
  preview?: ClientDeletionPreview | null;
  isLoadingPreview?: boolean;
  isScheduling?: boolean;
  reason?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange?: (reason: string) => void;
  onScheduleDeletion: () => void;
};

export const ClientDeleteModal = ({
  client,
  preview,
  isLoadingPreview = false,
  isScheduling = false,
  reason = '',
  isOpen,
  onOpenChange,
  onReasonChange,
  onScheduleDeletion,
}: ClientDeleteModalProps) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
    <ModalContent>
      {onClose => (
        <>
          <ModalHeader className="flex flex-col gap-1">Schedule client deletion?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              <span className="font-semibold">{client?.name}</span> will enter a grace period before cleanup runs. LGU
              and resident writes are locked while deletion is scheduled.
            </p>
            {Boolean(client?.deletionEffectiveAt) && (
              <p className="text-xs text-warning-600">Already scheduled for {formatDateTime(client?.deletionEffectiveAt)}.</p>
            )}
            {isLoadingPreview ? (
              <p className="text-sm text-default-500">Checking dependent records...</p>
            ) : preview ? (
              <div className="space-y-3">
                {preview.warnings.length > 0 && (
                  <div className="rounded-md border border-warning-200 bg-warning-50 p-3 text-xs text-warning-700">
                    {preview.warnings.join(' ')}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-default-600">
                  {Object.entries(preview.dependencies).map(([key, value]) => (
                    <div key={key} className="rounded-md border border-default-200 p-2">
                      <p className="font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <Textarea
              label="Reason"
              minRows={3}
              value={reason}
              onValueChange={onReasonChange}
              placeholder="Optional internal note for the deletion log"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={isScheduling}
              isDisabled={!preview?.canScheduleDeletion || isLoadingPreview}
              onPress={onScheduleDeletion}
            >
              Schedule Deletion
            </Button>
          </ModalFooter>
        </>
      )}
    </ModalContent>
  </Modal>
);
