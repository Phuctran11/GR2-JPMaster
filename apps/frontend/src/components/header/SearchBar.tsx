import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui';
import { courseAPI, type Course } from '../../services/api';

type SearchFormValues = {
  query: string;
};

export function SearchBar() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    defaultValues: { query: '' },
  });
  const searchQuery = watch('query');

  // Search courses by title
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchCourses = async () => {
      try {
        setSearchLoading(true);
        const result = await courseAPI.getAllCourses(50, 0);
        const filtered = result.data.filter((course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 8)); // Limit to 8 results
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCourses, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (values: SearchFormValues) => {
    if (values.query.trim()) {
      setShowSearchResults(false);
      reset();
    }
  };

  const handleCourseClick = (courseId: number) => {
    navigate(`/courses/${courseId}`, { state: { from: '/explore' } });
    setShowSearchResults(false);
    reset();
  };

  return (
    <div className="relative flex-1 md:flex-none max-w-xs md:max-w-sm">
      <form
        onSubmit={handleSubmit(handleSearch)}
        className="flex items-center bg-gradient-to-r from-surface-container to-surface-container-high rounded-full px-3 md:px-4 py-1.5 border-2 border-outline-variant/50 focus-within:border-primary focus-within:shadow-md focus-within:shadow-primary/20 transition-all duration-300"
      >
        <div className="text-primary">
          <Icon name="search" size="md" />
        </div>
        <input
          className="bg-transparent border-none focus:ring-0 text-label-md px-2 md:px-2 py-1 outline-none w-full placeholder:text-on-surface-variant/60 font-inter"
          placeholder="Search courses..."
          type="text"
          {...register('query')}
          onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setValue('query', '');
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {showSearchResults && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-gradient-to-b from-surface to-surface-container bg-surface/95 backdrop-blur-md border-2 border-primary/30 rounded-xl shadow-2xl shadow-primary/10 z-50 max-h-96 overflow-y-auto">
          {searchLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-block animate-spin mb-3 text-primary">
                <Icon name="sync" size="lg" />
              </div>
              <p className="text-label-md text-on-surface-variant font-medium">Searching courses...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="px-4 py-3 border-b border-primary/10 bg-primary/5">
                <p className="text-label-sm font-bold text-primary uppercase tracking-wide">
                  {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
                </p>
              </div>
              {searchResults.map((course, index) => (
                <button
                  key={course.course_id}
                  onClick={() => handleCourseClick(course.course_id)}
                  className={`block w-full text-left px-4 py-4 hover:bg-primary/10 transition-all duration-200 cursor-pointer group border-b border-outline-variant/20 last:border-b-0 ${
                    index === 0 ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full group-hover:w-1.5 transition-all"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {course.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-label-xs font-bold px-2 py-0.5 rounded-full ${
                          course.is_free 
                            ? 'bg-emerald-600/20 text-emerald-600' 
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {course.is_free ? 'Free' : `₫${course.price}`}
                        </span>
                        <span className="text-label-xs text-on-surface-variant">
                          {(course.enroll_count || 0).toLocaleString()} enrolled
                        </span>
                      </div>
                    </div>
                    <div className="text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100">
                      <Icon name="arrow_forward" size="md" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="inline-block mb-3 p-3 rounded-full bg-on-surface-variant/10 text-on-surface-variant">
                <Icon name="search_off" size="lg" />
              </div>
              <p className="text-label-md font-medium text-on-surface">No courses found</p>
              <p className="text-label-sm text-on-surface-variant mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
