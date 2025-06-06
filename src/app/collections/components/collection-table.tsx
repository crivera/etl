'use client'

import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { DocumentCollectionDTO } from '@/lib/consts'

import {
  createCollection,
  deleteCollection,
} from '@/server/routes/collection-action'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, FileUp, Upload, X } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'nextjs-toploader/app'

export default function CollectionTable({
  initialCollections,
}: {
  initialCollections: DocumentCollectionDTO[]
}) {
  const router = useRouter()
  const [collections, setCollections] = useState(initialCollections)
  const [isNewCollectionDialogOpen, setIsNewCollectionDialogOpen] =
    useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [collectionNameError, setCollectionNameError] = useState('')
  const [collectionToRemove, setCollectionToRemove] = useState<string | null>(
    null,
  )

  const handleOpenNewCollectionDialog = () => {
    setNewCollectionName('')
    setNewCollectionDescription('')
    setCollectionNameError('')
    setIsNewCollectionDialogOpen(true)
  }

  const onCollectionClick = (collection: DocumentCollectionDTO) => {
    router.push(`/collections/${collection.id}`)
  }

  const handleDeleteCollection = (collectionId: string) => {
    setCollectionToRemove(collectionId)
  }

  const { execute: createCollectionAction, isExecuting: isCreatingCollection } =
    useAction(createCollection, {
      onSuccess: ({ data }) => {
        toast.success('Collection created successfully')
        if (data) {
          setCollections([data, ...collections])
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    })

  const handleCreateCollection = () => {
    createCollectionAction({
      name: newCollectionName,
      description: newCollectionDescription,
    })
    setIsNewCollectionDialogOpen(false)
  }

  const { execute: deleteCollectionAction } = useAction(deleteCollection, {
    onSuccess: ({ data }) => {
      toast.success('Collection deleted successfully')
      if (data) {
        setCollections(
          collections.filter((collection) => collection.id !== data.id),
        )
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'An error occurred')
    },
  })

  const confirmRemove = () => {
    if (collectionToRemove) {
      deleteCollectionAction(collectionToRemove)
      setCollectionToRemove(null)
    }
  }

  const cancelRemove = () => {
    setCollectionToRemove(null)
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 transition-all duration-300`}>
            <div className="h-full flex flex-col border rounded-md">
              <div className="p-4 flex justify-between items-center border-b h-16">
                <h2 className="text-xl font-semibold">Document Collections</h2>
                <Button onClick={handleOpenNewCollectionDialog}>
                  <Upload className="h-4 w-4 mr-2" />
                  Create Collection
                </Button>
              </div>

              {collections.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <FileUp className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No collections created
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    With a collection, you can group your documents together and
                    extract data from them in a structured way.
                  </p>
                  <Button onClick={handleOpenNewCollectionDialog}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Collection
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[180px]">Added</TableHead>
                        <TableHead className="w-[80px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collections.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div
                              className={`flex items-center cursor-pointer hover:text-primary`}
                              onClick={() => onCollectionClick(item)}
                            >
                              <span className="truncate max-w-[250px]">
                                {item.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />

                              <span>
                                {formatDistanceToNow(item.createdAt, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCollection(item.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <span className="sr-only">Remove</span>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={isNewCollectionDialogOpen}
        onOpenChange={setIsNewCollectionDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="collectionName">Collection Name</Label>
              <Input
                id="collectionName"
                placeholder="Enter collection name"
                value={newCollectionName}
                onChange={(e) => {
                  setNewCollectionName(e.target.value)
                  setCollectionNameError('')
                }}
                className={collectionNameError ? 'border-red-500' : ''}
                autoFocus
              />
              {collectionNameError && (
                <p className="text-sm text-red-500">{collectionNameError}</p>
              )}
              <Label htmlFor="collectionDescription">
                Collection Description
              </Label>
              <Input
                id="collectionDescription"
                placeholder="Enter collection description"
                value={newCollectionDescription}
                onChange={(e) => {
                  setNewCollectionDescription(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateCollection()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewCollectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              disabled={isCreatingCollection}
            >
              {isCreatingCollection ? 'Creating...' : 'Create Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!collectionToRemove}
        onOpenChange={() => setCollectionToRemove(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to remove this collection? This action
              cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRemove}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
