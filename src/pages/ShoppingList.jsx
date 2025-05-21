import { useEffect, useState, useCallback } from 'react';
import { FaTrash, FaRedo } from 'react-icons/fa'; // For delete and refresh icons

export default function ShoppingList() {
  const [shoppingListItems, setShoppingListItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All', 'Purchased', 'Pending'
  const [updatingItemId, setUpdatingItemId] = useState(null); // For item-specific loading

  const getToken = useCallback(() => localStorage.getItem('token') || sessionStorage.getItem('token'), []);

  const fetchShoppingList = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/shopping-list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch shopping list: ${res.status}`);
      }
      const data = await res.json();
      setShoppingListItems(data);
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError(err.message || 'Could not load your shopping list.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  const handleTogglePurchased = async (itemId, currentStatus) => {
    setUpdatingItemId(itemId);
    const token = getToken();
    if (!token) {
      setError('Authentication required.');
      setUpdatingItemId(null);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/shopping-list/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_purchased: !currentStatus }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update item status.');
      }
      // Refresh list to show updated status
      await fetchShoppingList(); 
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Could not update item. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId) => {
    setUpdatingItemId(itemId);
    const token = getToken();
    if (!token) {
      setError('Authentication required.');
      setUpdatingItemId(null);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this item?')) {
      setUpdatingItemId(null);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/shopping-list/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete item.');
      }
      // Refresh list
      await fetchShoppingList();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Could not delete item. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const getFilteredItems = () => {
    if (filter === 'Purchased') {
      return shoppingListItems.filter(item => item.is_purchased);
    }
    if (filter === 'Pending') {
      return shoppingListItems.filter(item => !item.is_purchased);
    }
    return shoppingListItems;
  };

  const displayedItems = getFilteredItems();

  // Group by category for display
  const categorizedList = displayedItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized'; // Handle null/empty category
    acc[category] = acc[category] || [];
    acc[category].push(item);
    return acc;
  }, {});

  if (loading && shoppingListItems.length === 0) { // Initial load
    return <div className="text-center mt-20 text-lg text-zinc-600 dark:text-zinc-300">Loading your shopping list...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDF6EC] dark:bg-[#1E1E1E] text-zinc-800 dark:text-white p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold">Your Shopping List</h2>
        <button
          onClick={fetchShoppingList}
          disabled={loading}
          className="flex items-center px-3 py-1.5 bg-[#F4A261] hover:bg-[#E76F51] text-white rounded-md text-sm shadow disabled:opacity-60"
        >
          <FaRedo className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading && !updatingItemId ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300 px-4 py-3 rounded-md relative mb-4 text-sm" role="alert">{error}</p>}

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
        {['All', 'Pending', 'Purchased'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border ${
              filter === filterType
                ? 'bg-[#F4A261] text-white border-[#F4A261]'
                : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-500 text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-600'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>
      
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg p-4 sm:p-6">
        {(!loading || shoppingListItems.length > 0) && displayedItems.length === 0 && filter === 'All' && (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">Your shopping list is currently empty.</p>
        )}
        {(!loading || shoppingListItems.length > 0) && displayedItems.length === 0 && filter !== 'All' && (
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">No items match the filter: "{filter}".</p>
        )}

        {Object.entries(categorizedList).length > 0 ? (
          <div className="space-y-5">
            {Object.entries(categorizedList).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-lg font-semibold mb-2 capitalize border-b pb-1.5 border-zinc-200 dark:border-zinc-700 text-[#E76F51] dark:text-[#F4A261]">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-md transition-opacity ${updatingItemId === item.id ? 'opacity-50' : ''} ${item.is_purchased ? 'bg-zinc-100 dark:bg-zinc-700/50' : ''}`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!item.is_purchased}
                          onChange={() => handleTogglePurchased(item.id, !!item.is_purchased)}
                          disabled={updatingItemId === item.id}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 text-[#F4A261] focus:ring-[#E76F51] dark:bg-zinc-600 checked:bg-[#F4A261]"
                        />
                        <span className={`${item.is_purchased ? 'line-through text-zinc-500 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-100'} text-sm`}>
                          {item.name}
                          {item.quantity && <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">({item.quantity})</span>}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={updatingItemId === item.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        aria-label="Delete item"
                      >
                        <FaTrash size="0.875rem" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          // This handles the case where the list is empty after filtering, but not initial empty state
          (shoppingListItems.length > 0 && displayedItems.length === 0) && 
          <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">No items to display for "{filter}".</p>
        )}
      </div>
    </div>
  );
}
