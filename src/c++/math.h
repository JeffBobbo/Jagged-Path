#ifndef MATH_H_INCLUDE
#define MATH_H_INCLUDE

#include <chrono>
#include <cstdint>
#include <random>

#define KERNEL_SIZE 5
void CreateGaussianFilter(double kernel[][KERNEL_SIZE]);

inline uint64_t EpochTime() { return std::chrono::system_clock::now().time_since_epoch() / std::chrono::milliseconds(1); };

template <class T> T RandRange(T min, T max);

#endif