'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Input,
  Button,
} from '@chakra-ui/react';
import { Calendar, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      p={4}
      bg="gray.100"
    >
      <Box
        w="full"
        maxW="420px"
        bg="white"
        borderRadius="xl"
        p={8}
        boxShadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <VStack gap={6} mb={8} textAlign="center">
          <Flex
            w={14}
            h={14}
            bg="brand.600"
            borderRadius="xl"
            align="center"
            justify="center"
            color="white"
            boxShadow="0 10px 15px -3px rgba(79, 70, 229, 0.25)"
          >
            <Calendar size={28} />
          </Flex>
          <Box>
            <Heading as="h1" size="lg" fontWeight="bold" color="gray.900" letterSpacing="-0.02em">
              Calendário de Tarefas
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Acesse sua conta para gerenciar suas atividades
            </Text>
          </Box>
        </VStack>

        {errorMessage && (
          <Flex
            align="center"
            gap={2}
            bg="red.50"
            color="red.700"
            borderWidth="1px"
            borderColor="red.200"
            p={3}
            borderRadius="md"
            fontSize="sm"
            mb={6}
          >
            <AlertCircle size={18} />
            <Text>{errorMessage}</Text>
          </Flex>
        )}

        <form onSubmit={handleLogin}>
          <VStack gap={5} align="stretch">
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>
                E-mail
              </Text>
              <Box position="relative">
                <Flex
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <Mail size={18} />
                </Flex>
                <Input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  pl={10}
                  bg="white"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'brand.600' }}
                  fontSize="sm"
                />
              </Box>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>
                Senha
              </Text>
              <Box position="relative">
                <Flex
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <Lock size={18} />
                </Flex>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  pl={10}
                  bg="white"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'brand.600' }}
                  fontSize="sm"
                />
              </Box>
            </Box>

            <Button
              type="submit"
              disabled={loading}
              bg="brand.600"
              color="white"
              _hover={{ bg: 'brand.700' }}
              boxShadow="0 4px 6px -1px rgba(79, 70, 229, 0.25)"
              mt={2}
              py={3}
              fontWeight="semibold"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </Button>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
