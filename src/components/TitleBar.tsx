export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-center h-8 bg-[#2d2d2d] text-gray-200 select-none"
      style={
        {
          WebkitAppRegion: 'drag', // draggable region
        } as React.CSSProperties
      }
    >
      <div className="text-sm font-medium tracking-wide">Tuff MCP Manager</div>
    </div>
  );
}
