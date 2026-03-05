import { Transition } from '@headlessui/react';
import { Link } from '@inertiajs/react';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const DropDownContext = createContext();

const Dropdown = ({ children, open: controlledOpen, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = (value) => {
        if (onOpenChange) {
            onOpenChange(value);
        }
        setInternalOpen(value);
    };

    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
};

const Trigger = ({ children }) => {
    const { open, setOpen, toggleOpen } = useContext(DropDownContext);

    return (
        <>
            <div onClick={toggleOpen}>{children}</div>

            {open && createPortal(
                <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setOpen(false)}
                />,
                document.body
            )}
        </>
    );
};

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white',
    children,
}) => {
    const { open, setOpen } = useContext(DropDownContext);
    const anchorRef = useRef(null);
    const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });

    const updatePos = useCallback(() => {
        if (anchorRef.current && open) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 8,
                left: rect.left,
                right: window.innerWidth - rect.right,
            });
        }
    }, [open]);

    useEffect(() => {
        updatePos();
        if (open) {
            window.addEventListener('scroll', updatePos, true);
            window.addEventListener('resize', updatePos);
            return () => {
                window.removeEventListener('scroll', updatePos, true);
                window.removeEventListener('resize', updatePos);
            };
        }
    }, [open, updatePos]);

    let widthClasses = '';
    if (width === '48') {
        widthClasses = 'w-48';
    }

    const alignStyle = align === 'left'
        ? { left: pos.left }
        : { right: pos.right };

    return (
        <>
            {/* Hidden anchor to track position */}
            <div ref={anchorRef} className="absolute top-full right-0 left-0 h-0 pointer-events-none" />

            {open && createPortal(
                <Transition
                    show={open}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div
                        className={`fixed z-[9999] rounded-md shadow-lg ${widthClasses}`}
                        style={{ top: pos.top, ...alignStyle }}
                        onClick={() => setOpen(false)}
                    >
                        <div
                            className={
                                `rounded-md ring-1 ring-black ring-opacity-5 ` +
                                contentClasses
                            }
                        >
                            {children}
                        </div>
                    </div>
                </Transition>,
                document.body
            )}
        </>
    );
};

const DropdownLink = ({ className = '', children, ...props }) => {
    return (
        <Link
            {...props}
            className={
                'block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ' +
                className
            }
        >
            {children}
        </Link>
    );
};

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
