import type { ClientLgu } from '@/pages/contents/SuperAdmin/types';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

type ClientDeleteModalProps = {
  client: ClientLgu | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
};

export const ClientDeleteModal = ({ client, isOpen, onOpenChange, onDelete }: ClientDeleteModalProps) => (
  <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm">
    <ModalContent>
      {onClose => (
        <>
          <ModalHeader className="flex flex-col gap-1">Delete client?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              This removes <span className="font-semibold">{client?.name}</span> from client management and deactivates
              LGU admin access assigned to it.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={onDelete}>
              Delete
            </Button>
          </ModalFooter>
        </>
      )}
    </ModalContent>
  </Modal>
);
