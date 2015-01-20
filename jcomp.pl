#!/usr/bin/perl

# writing this in perl for now, but may port to ruby as I'm interested to learn
# decided ruby sucks

# script functionality:
# concatenate js files together -- done
# remove comments -- done
# remove whitespace -- done
# add license at start -- done
# ignore json -- could include this
# rule file -- wip
# parse html and edit scripts -- todo

use warnings;
use strict;

use Switch;

# config class?
package Config;

my $comment = '#'; # what denotes a comment in the configuration file

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  return $self;
}

sub File
{
  my $self = shift;
  return $self->{file};
}

sub Read
{
  my $self = shift;
  open(my $fh, '<', $self->{file}) or die "Can't open $self->{file} for reading: $!\n";
  while (<$fh>)
  {
    chomp(); # remove tailing whitespace
    my $parseTo = index($_, $comment);

    my $line = $_;
    $line = substr($_, 0, $parseTo) if ($parseTo >= 0); # chop of comments
    my @tokens = split(/[:,] /, $line);

    my $param =  shift(@tokens);
    $self->{config}->{$param} = join(' ', @tokens); # store the values as a space deliminated list
  }
  close($fh);
}

sub GetParam
{
  my $self = shift;
  my $param = shift;

  if (defined $param)
  {
    return $self->{config}->{$param}
  }
  return undef;
}

## end of Config

package Source;

sub new
{
  my $class = shift;
  my $file = shift;

  my $self = {};

  bless($self, $class);

  $self->{file} = $file;
  $self->{text} = undef;
  $self->{line} = undef;
  return $self;
}

sub Read
{
  my $self = shift;

  open(my $fh, '<', $self->{file}) or die "Couldn't open $self->{file} for reading: $!\n";
  my @lines = <$fh>;
  close($fh);
  $self->{text} = \@lines;
}

sub Write
{
  my $self = shift;
  my $dest = shift;

  if (defined $self->{line})
  {
    $$dest .= $self->{line};
  }
  else # should only happen for the copyright file
  {
    foreach my $line (@{$self->{text}})
    {
      $$dest .= $line;
    }
  }
}

sub ScrubSingleLineComments
{
  my $self = shift;
#  print "ScrubSingleLineComments\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    my $comment = index($lines[$i], '//');
    if ($comment >= 0)
    {
      $lines[$i] = substr($lines[$i], 0, $comment);
    }
  }
  $self->{text} = \@lines;
}

sub ScrubLeadTrailWhitespace
{
  my $self = shift;
#  print "ScrubLeadTrailWhitespace\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    $lines[$i] =~ s/^[\t ]+//; # leading
    $lines[$i] =~ s/[\t ]+$//; # trailing
  }
  $self->{text} = \@lines;
}

sub ScrubNewLines
{
  my $self = shift;
#  print "ScrubNewLines\n";
  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    $lines[$i] =~ s/[\r\n]//g; # replace any literal new lines
    $self->{line} .= $lines[$i]; # append to new var
  }
}

sub ScrubMultiLineComments
{
  my $self = shift;
  print "ScrubMultiLineComments\n";
  my $open = index($self->{line}, '/*');
  while ($open >= 0)
  {
    my $close = index($self->{line}, '*/');
    if ($close == -1) # there is no end, strip the rest of the file
    {
      $close = length($self->{line});
    }
    my $start = substr($self->{line}, 0, $open);
    my $end   = substr($self->{line}, $close + 2, length($self->{line}) - $close);
    $self->{line} = $start . $end;
    $open = index($self->{line}, '/*');
  }
}

sub HTMLReplaceSources
{
  my $self = shift;
  print "HTMLReplaceSources\n";
  my @sources = @{shift()};

  my @lines = @{$self->{text}};
  for (my $i = 0; $i <= $#lines; $i++)
  {
    my $tag = index(lc($lines[$i]), '<script');
    next if ($tag == -1); # no script tag on this line

    my $tagEnd = index($lines[$i], '>', $tag);
    my $source = index($lines[$i], 'src="', $tag) + 4;
    next if ($source == -1 || $source > $tagEnd); # this is no source, but an inline script, so skip

    my $sourceEnd = index($lines[$i], '"', $source);
    my $script = substr($lines[$i], $source, $sourceEnd - $source);

    my $remove = 0;
    foreach my $srcFile (@sources)
    {
      if ($srcFile eq $script)
      {
        $remove = 1;
        last;
      }
    }
  }
}

## end of Source

# main
package main;

my $configFile = '';
#my $version = ''; # target version
my $vcs = 'git';
#my $username = '';
#my $password = '';
my $makeDoc = 0;
my $update = 0;
my $updateSelf = 0;

# get our args
foreach my $ARG (@ARGV)
{
  $makeDoc = 1 if (index($ARG, 'make-doc') != -1 || index($ARG, 'doc') != -1);
  $update  = 1 if (index($ARG, 'update')   != -1 || index($ARG, 'up')  != -1);
  $updateSelf = 1 if (index($ARG, 'update-dep') != -1 || index($ARG, 'up-dep') != -1);

  $configFile = substr($ARG, 3) if (index($ARG, '-c=') != -1);
  #$version = substr($ARG, 3) if (index($ARG, '-v=') != -1);

  #$username = substr($ARG, 3) if (index($ARG, '-u=') != -1);
  # change this to be done on request so that we can mask the input
  #$password = substr($ARG, 3) if (index($ARG, '-p=') != -1);

  Help() if ($ARG eq 'help');
}


my $config = Config->new($configFile); # create config file object
$config->Read(); # read in data

# do the update
if ($update == 1 || $updateSelf == 1)
{
  use LWP::Simple;

  my $url = $config->GetParam('repo-archive');
  if (!defined $url || $url eq '')
  {
    print STDERR "repo-archive not specified in config file\n";
    exit(1);
  }
  my $zip = '/tmp/JaggedPath.zip';
  my $code = mirror($url, $zip);
  if ($code != 200)
  {
    print STDERR "Downloading failed, returned code: " . $code . "\n";
    exit(1);
  }

  use Archive::Zip qw(:ERROR_CODES :CONSTANTS);

  my $ar = Archive::Zip->new();
  unless ($ar->read($zip) == AZ_OK)
  {
    die "Failed to read $zip\n";
  }
  $ar->extractTree('', '/tmp/JaggedPath/');

  opendir(my $dh, '/tmp/JaggedPath') or die "Failed to open /tmp/JaggedPath: $!\n";
  my @files = grep(!/^\.\.?$/, readdir($dh));
  closedir($dh);

  if ($#files != 0)
  {
    print STDERR "Found " . ($#files == -1 ? "no" : $#files+1) . " files in '/tmp/JaggedPath/', exiting\n";
    exit(1);
  }

  use File::Copy "mv";

  if ($updateSelf == 1)
  {
    use FindBin;

    mv('/tmp/JaggedPath/' . $files[0] . '/jcomp.pl', $FindBin::Bin . '/jcomp.pl') or Fatal("Failed update self: $!\n");
    mv('/tmp/JaggedPath/' . $files[0] . '/conf', $FindBin::Bin . '/conf') or Fatal("Failed update config: $!\n");
    print "Updated deployment script\n";
  }
  else
  {
    use File::Path qw(remove_tree);
    my $dest = $config->GetParam('serve-location');
    if (!defined $dest || $dest eq "")
    {
      print STDERR "serve-location not set in config\n";
      exit(1);
    }

    # miniturization stuff...


    # remove the directory
    remove_tree($dest);

    print "Updating into $dest ...\n";
    mv('/tmp/JaggedPath/' . $files[0] . '/src', $dest) or Fatal("Failed update release: $!\n");

  }
  CleanUp();
}
else
{
  Help();
}
exit(0);

# parse the js stuff
my $fileList = $config->GetParam('source-js');
my @files = split(' ', $fileList);
print "JS source files: @files\n";
my $content = "";
for (my $i = 0; $i <= $#files; $i++)
{
  my $source = Source->new($files[$i]); # repopulate file list with Source objects
  $source->Read();
  $source->ScrubSingleLineComments();
  $source->ScrubLeadTrailWhitespace();
  $source->ScrubNewLines();
  $source->ScrubMultiLineComments();
  $source->Write(\$content);
}

my $precontent = "";
my $postcontent = "";

# handle copyright
my $copyrightFile = $config->GetParam('copyright-file');
if (defined $copyrightFile)
{
  my $copyright = Source->new($copyrightFile);
  $copyright->Read();
  $precontent .= "/*\n";
  $copyright->Write(\$precontent);
  $precontent .= "\n" if (substr($precontent, -1) ne "\n");
  $precontent .= "*/\n\n";
}

# write the data out
my $target = $config->GetParam('target-js');
open(my $fh, '>', $target) or die "Couldn't open $target for writing: $!\n";
print $fh $precontent;
print $fh $content;
print $fh $postcontent;
close($fh);


# now handle html
my $htmlList = $config->GetParam('source-html');
my @htmlFiles = split(' ', $htmlList);
print "HTML source files: @htmlFiles\n";
for (my $i = 0; $i <= $#htmlFiles; $i++)
{
  my $html = Source->new($files[$i]);
  $html->Read();
#  $html->HTMLReplaceSources(\@files);
}
exit(0);

sub Help
{
  print <<EOH;
$0 - Deployment/update script for Jagged Path

Commands:
  update       (or 'up')       -- update the currently release
  update-dep   (or 'up-dep')   -- update this script and conf
  make-doc     (or 'doc')      -- generate documentation
  help                         -- this help text

Options:
--c=file
    Configuration file, required for pretty much everything

EOH
  exit(0);
}

sub Fatal
{
  my $error = shift;
  print STDERR "Execution failed: $error\nCleaning up mess...\n";
  CleanUp();
  exit(1);
}

sub CleanUp
{
  use File::Path qw(remove_tree);
  remove_tree('/tmp/JaggedPath', '/tmp/JaggedPath.zip');
}
