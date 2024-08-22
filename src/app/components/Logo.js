import Image from "next/image";

export default function Logo({ asset }) {
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <Image 
                className="me-2"
                src={asset.logo}
                alt={asset.name}
                width={20}
                height={20}
                onContextMenu={(e) => e.preventDefault()}  // Disable right-click
                draggable={false}  // Prevent dragging
                style={{ userSelect: 'none', pointerEvents: 'none' }}  // Disable text selection and pointer events
            />
            {/* Overlay a transparent div to intercept any other actions */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                pointerEvents: 'none',
            }} />
        </div>
    );
}