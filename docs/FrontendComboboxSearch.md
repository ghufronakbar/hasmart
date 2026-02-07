# Frontend Combobox Search Rules

This document outlines the standard approach for implementing backend-driven search in Combobox components.

## Rules

### Backend Search

Always use backend filtering for search queries, never filter a large dataset client-side.

### Parameters

limit: Set to 20 items to optimize payload size.
sort: Set to asc (ascending).
sortBy: Set to name (or relevant label field).
search: Pass the debounced search term.

### Debounce

Debounce input by 200ms before triggering the API call.

### Selection Preserving

When editing an existing item (or when a value is selected), ensure the selected item is part of the options list, even if it falls outside the current search/limit.
This often requires fetching the detail of the selected item separately or merging the selected item from the full detail response into the options list.

## Implementation Pattern

```typescript
// 1. State for Search
const [searchItem, setSearchItem] = useState("");
const debouncedSearchItem = useDebounce(searchItem, 200);
// 2. Query Hook with Params
const { data: items } = useItems({
    page: 1,
    limit: 20,
    search: debouncedSearchItem,
    sortBy: "name",
    sort: "asc"
});
// 3. Merging Options (Critical for Edit Mode)
const itemOptions = useMemo(() => {
    const listItems = items?.data || [];
    // If you have a selected item from a detail query, merge it here
    // ... logic to deduplicate ...
    return listItems;
}, [items?.data]);
// 4. Component Usage
<Combobox
    inputValue={searchItem}
    onInputChange={setSearchItem}
    options={itemOptions}
    // ...
/>
```
