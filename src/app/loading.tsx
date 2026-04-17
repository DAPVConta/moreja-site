export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ededd1] border-t-[#010744] rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    </div>
  )
}
