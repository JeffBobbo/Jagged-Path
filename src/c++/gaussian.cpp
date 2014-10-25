#include "math.h"

#include <cmath>

void GetGaussianFilter(double[][KERNEL_SIZE] kernel)
{
  static double[][KERNEL_SIZE] cache = nullptr;
  if (!cache)
    CreateGaussianFilter(cache);
  kernel = cache;
}

void CreateGaussianFilter(double[][KERNEL_SIZE] kernel)
{
  float sigma = 1.0f;
  float s = 2.0f * sigma * sigma;
  float sum = 0.0f; // normalization

  for (uint8_t x = -(KERNEL_SIZE >> 1); x <= (KERNEL_SIZE >> 1); ++x)
  {
    for (uint8_t y = -(KERNEL_SIZE >> 1); y <= (KERNEL_SIZE >> 1); ++y)
    {
      float r = std::sqrt(x*x + y*y);
      r = std::exp(-(r*r)/s);
      kernel[(x + (KERNEL_SIZE >> 1))][(y + (KERNEL_SIZE >> 1))] = r/(PI_F * s);
      sum += kernel[x + (KERNEL_SIZE >> 1)][y + (KERNEL_SIZE >> 1)];
    }
  }

  // normalize!
  for (uint8_t i = 0; i < KERNEL_SIZE; ++i)
  {
    for (uint8_t j = 0; j < KERNEL_SIZE; ++j)
      kernel[i][j] /= sum;
  }
  return kernel;
}

Kernel GetKernel(uint8_t size)
{
  size = (size << 1) + 1; // make sure it's odd

  if (filterList.find(size) == filterList.end()) // if it doesn't exist yet, add it
    filterList[size] = CreateKernel(size);
  return filterList.find(size)->second;
}

#include <iostream>
void gaussian::Test()
{
  gaussian::Kernel kernel = gaussian::GetKernel(5);
  for (uint8_t x = 0; x < kernel.size(); ++x)
  {
    for (uint8_t y = 0; y < kernel[x].size(); ++y)
      std::cout << kernel[x][y] << " ";
    std::cout << std::endl;
  }
}
