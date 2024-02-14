import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Input,
  SkeletonText,
  Text,
  IconButton
} from '@chakra-ui/react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api';

const center = { lat: 23.0225, lng: 72.5714 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [source, setSource] = useState('');
  const sourceRef = useRef();

  useEffect(() => {
    if (isLoaded) {
      setMap(map);
    }
  }, [isLoaded, map]);

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function calculateRoute() {
    if (sourceRef.current.value === '' || destinations.length === 0) {
      return;
    }

    const waypoints = destinations.map(destination => ({
      location: destination,
      stopover: true,
    }));
    //checkpoint
    const directionsService = new window.google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: sourceRef.current.value,
      destination: sourceRef.current.value,
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true, // Optimize the order of waypoints
    });
    
    setDirectionsResponse(results);

  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDestinations([]);
    setSource('');
    sourceRef.current.value = '';
  }

  function handleMapClick(event) {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    setSource(clickedLocation);
  }

  function removeDestination(index) {
    const updatedDestinations = [...destinations];
    updatedDestinations.splice(index, 1);
    setDestinations(updatedDestinations);
  }

  async function handleDestinationChange(value) {
    if (!value) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: value }, (results, status) => {
      if (status === 'OK' && results.length > 0) {
        const location = results[0].geometry.location.toJSON();
        setDestinations([...destinations, location]);
      }
    });

    
  }

  function getSortedDestinations() {
    // Sort destinations based on the route
    const sortedDestinations = [...destinations];
    sortedDestinations.sort((a, b) => {
      const distanceA = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(source),
        new window.google.maps.LatLng(a)
      );
      const distanceB = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(source),
        new window.google.maps.LatLng(b)
      );
      return distanceA - distanceB;
    });
    return sortedDestinations;
  }

  return (
    <Flex
      position='relative'
      h='100vh'
      w='100vw'
    >
      <Box flex="1" p={4}>
        <HStack spacing={2} justifyContent='space-between'>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type='text'
                placeholder='Enter Technician location'
                ref={sourceRef}
                onChange={(e) => setSource(e.target.value)}
              />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type='text'
                placeholder='Enter Address'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDestinationChange(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </Autocomplete>
          </Box>
          <ButtonGroup>
            <Button colorScheme='blue' type='submit' onClick={calculateRoute}>
            Plan Route
            </Button>
            <IconButton
              aria-label='center back'
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent='space-between'>
          <FaLocationArrow
            aria-label='center back'
            isRound
            onClick={() => {
              map && map.panTo(center);
              map && map.setZoom(15);
            }}
          />
        </HStack>
        <Box mt={4}>
          <Text fontWeight='bold'>Destinations:</Text>
          <ul>
            {getSortedDestinations().map((destination, index) => (
              <li key={index}>
                {`(${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)})`}
                <Button style={{ margin: '10px 10px' }} colorScheme='green' type='submit' onClick={() => removeDestination(index)}>
              complete Route
              </Button>

              </li>
              
            ))}
          </ul>
        </Box>
      </Box>
      <Box flex="1" position='relative' left={0} top={0} h='100%' w='100%'>
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
          onLoad={map => setMap(map)}
          onClick={handleMapClick}
        >
          <Marker position={source} label="A" icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png" />
          {getSortedDestinations().map((destination, index) => (
            <Marker
              key={index}
              position={destination}
              onClick={() => removeDestination(index)}
              icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            />
          ))}
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
          
        </GoogleMap>
      </Box>
    </Flex>
  );
}

export default App;
