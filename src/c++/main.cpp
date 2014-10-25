#include "math.h"

#include <iostream>

int main(int argc, char** argv)
{
  double kernel[KERNEL_SIZE][KERNEL_SIZE];
  CreateGaussianFilter(kernel);

  for (uint8_t x = 0; x < KERNEL_SIZE; ++x)
  {
    std::cout << RandRange(0, 5) << std::endl;
    std::cout << RandRange(10.0, 15.0) << std::endl;
  }

  
  return 0;
}