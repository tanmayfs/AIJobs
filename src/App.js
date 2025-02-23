import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  ListItemIcon,
  ListItemText,
  Link,
  Fab,
  Button
} from '@mui/material';
import { fetchJobs } from './services/api';
import FilterSidebar from './components/FilterSidebar';
import SearchBar from './components/SearchBar';
import JobList from './components/JobList';
import SortIcon from '@mui/icons-material/Sort';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useColorMode } from './theme/ThemeContext';

const DRAWER_WIDTH = 280;

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    companies: [],
    locations: [],
    departments: [],
    remote: false,
    salary: [0, 500000]
  });
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [sortOption, setSortOption] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const theme = useTheme();
  const { toggleColorMode, mode } = useColorMode();

  const handleSortClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorEl(null);
  };

  const handleSortOptionSelect = (option) => {
    setSortOption(option);
    handleSortClose();
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        const response = await fetchJobs();
        if (response && response.jobs) {
          setJobs(response.jobs);
          setFilteredJobs(response.jobs);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const applyFiltersAndSort = (jobs, filters, searchQuery, sortOption) => {
    let filteredJobs = [...jobs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        (job.department && job.department.toLowerCase().includes(query))
      );
    }

    // Apply company filter
    if (filters.companies?.length > 0) {
      filteredJobs = filteredJobs.filter(job => filters.companies.includes(job.companyName));
    }

    // Apply location filter
    if (filters.locations?.length > 0) {
      filteredJobs = filteredJobs.filter(job => {
        const jobLocation = job.location.toLowerCase();
        return filters.locations.some(filterLocation => {
          const normalizedFilter = filterLocation.toLowerCase();
          return jobLocation.includes(normalizedFilter);
        });
      });
    }

    // Apply department filter
    if (filters.departments?.length > 0) {
      filteredJobs = filteredJobs.filter(job => job.department && filters.departments.includes(job.department));
    }

    // Apply remote filter
    if (filters.remote) {
      filteredJobs = filteredJobs.filter(job => job.remote);
    }

    // Apply salary filter only if it's different from the default range
    if (filters.salary && (filters.salary[0] > 0 || filters.salary[1] < 500000)) {
      const [minSalary, maxSalary] = filters.salary;
      filteredJobs = filteredJobs.filter(job => {
        const salary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) : 0;
        return salary >= minSalary && salary <= maxSalary;
      });
    }

    // Apply sorting
    if (sortOption) {
      switch (sortOption) {
        case 'alphabetical':
          filteredJobs.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'salary-high-low':
          filteredJobs.sort((a, b) => {
            const salaryA = a.salary ? parseInt(a.salary.replace(/[^0-9]/g, '')) : 0;
            const salaryB = b.salary ? parseInt(b.salary.replace(/[^0-9]/g, '')) : 0;
            return salaryB - salaryA;
          });
          break;
        case 'salary-low-high':
          filteredJobs.sort((a, b) => {
            const salaryA = a.salary ? parseInt(a.salary.replace(/[^0-9]/g, '')) : 0;
            const salaryB = b.salary ? parseInt(b.salary.replace(/[^0-9]/g, '')) : 0;
            return salaryA - salaryB;
          });
          break;
        default:
          break;
      }
    }

    return filteredJobs;
  };

  useEffect(() => {
    // Only apply filters if there are actual filters or search terms
    const hasActiveFilters = 
      selectedFilters.companies.length > 0 ||
      selectedFilters.locations.length > 0 ||
      selectedFilters.departments.length > 0 ||
      selectedFilters.remote ||
      selectedFilters.salary[0] > 0 ||
      selectedFilters.salary[1] < 500000 ||
      searchQuery ||
      sortOption;

    if (hasActiveFilters) {
      const filteredResults = applyFiltersAndSort(jobs, selectedFilters, searchQuery, sortOption);
      setFilteredJobs(filteredResults);
    } else {
      setFilteredJobs(jobs);
    }
  }, [jobs, selectedFilters, searchQuery, sortOption]);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters) => {
    setSelectedFilters(filters);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <FilterSidebar
        jobs={jobs}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        width={DRAWER_WIDTH}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center', 
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
              <Link 
                href="/"
                sx={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': {
                    textDecoration: 'none'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" component="span" sx={{ fontWeight: 500, color: '#c1ff72' }}>
                    AIJobsNow
                  </Typography>
                  <Typography variant="h4" component="span" sx={{ fontWeight: 500, color: '#ffffff' }}>
                    by{' '}
                  </Typography>
                  <Link
                    href="https://fourslash.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    <Typography variant="h4" component="span" sx={{ fontWeight: 500, color: '#ffffff' }}>
                      Fourslash
                    </Typography>
                  </Link>
                </Box>
              </Link>
            </Box>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                bgcolor: 'background.paper',
                py: 0.5,
                px: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {`${filteredJobs.length} jobs available`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleSortClick}
              color="inherit"
              aria-label="sort"
            >
              <SortIcon />
            </IconButton>
          </Box>
        </Box>

        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleSortClose}
        >
          <MenuItem 
            onClick={() => handleSortOptionSelect('alphabetical')}
            selected={sortOption === 'alphabetical'}
          >
            <ListItemIcon>
              <SortByAlphaIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Alphabetical Order (A-Z)</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortOptionSelect('salary-low-high')}
            selected={sortOption === 'salary-low-high'}
          >
            <ListItemIcon>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Salary Range (Low to High)</ListItemText>
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortOptionSelect('salary-high-low')}
            selected={sortOption === 'salary-high-low'}
          >
            <ListItemIcon>
              <TrendingDownIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Salary Range (High to Low)</ListItemText>
          </MenuItem>
        </Menu>

        <JobList 
          jobs={filteredJobs}
          loading={loading}
          error={error}
        />
      </Box>

      {showScrollTop && (
        <Fab
          size="large"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: '#c1ff72',
            '&:hover': {
              bgcolor: '#9ecc5c'
            }
          }}
          onClick={scrollToTop}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 32, color: '#000000' }} />
        </Fab>
      )}
    </Box>
  );
}

export default App;
