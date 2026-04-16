import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'

interface DeleteManagerModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    managerName: string
}

export default function DeleteManagerModal({
    isOpen,
    onClose,
    onConfirm,
    managerName
}: DeleteManagerModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        Delete Facility Manager?
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete <span className="font-medium">{managerName}</span>?
                    </p>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
