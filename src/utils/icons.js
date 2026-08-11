export const initIcons = () => {
    return Object.fromEntries(
        Object.entries(
            import.meta.glob('@/assets/icons/**/*.vue', { eager: true })
        ).map(([path, importFn]) => {
            const file = path.split('/').pop().split('.')[0]
            return [file, importFn]
        })
    )
}