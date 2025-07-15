'use client'

import { Input } from '@/app/components/ui/input'

interface SearchAndStatsProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  filteredRowsCount: number
  totalRowsCount: number
  columnsCount: number
}

export const SearchAndStats = ({
  globalFilter,
  onGlobalFilterChange,
  filteredRowsCount,
  totalRowsCount,
  columnsCount,
}: SearchAndStatsProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <div className="relative">
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ''}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            className="w-64"
          />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        {filteredRowsCount} of {totalRowsCount} file{totalRowsCount !== 1 ? 's' : ''} • {columnsCount} column{columnsCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}