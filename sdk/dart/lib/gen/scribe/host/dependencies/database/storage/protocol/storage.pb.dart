// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/database/storage/protocol/storage.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class ObjectRef extends $pb.GeneratedMessage {
  factory ObjectRef({
    $core.String? folder,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? pathArgs,
    $core.String? filename,
  }) {
    final result = create();
    if (folder != null) result.folder = folder;
    if (pathArgs != null) result.pathArgs.addEntries(pathArgs);
    if (filename != null) result.filename = filename;
    return result;
  }

  ObjectRef._();

  factory ObjectRef.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ObjectRef.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ObjectRef',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'folder')
    ..m<$core.String, $core.String>(2, _omitFieldNames ? '' : 'pathArgs',
        entryClassName: 'ObjectRef.PathArgsEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.clients.storage.v1'))
    ..aOS(3, _omitFieldNames ? '' : 'filename')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ObjectRef clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ObjectRef copyWith(void Function(ObjectRef) updates) =>
      super.copyWith((message) => updates(message as ObjectRef)) as ObjectRef;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ObjectRef create() => ObjectRef._();
  @$core.override
  ObjectRef createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ObjectRef getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<ObjectRef>(create);
  static ObjectRef? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get folder => $_getSZ(0);
  @$pb.TagNumber(1)
  set folder($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasFolder() => $_has(0);
  @$pb.TagNumber(1)
  void clearFolder() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbMap<$core.String, $core.String> get pathArgs => $_getMap(1);

  @$pb.TagNumber(3)
  $core.String get filename => $_getSZ(2);
  @$pb.TagNumber(3)
  set filename($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasFilename() => $_has(2);
  @$pb.TagNumber(3)
  void clearFilename() => $_clearField(3);
}

class UploadRequest extends $pb.GeneratedMessage {
  factory UploadRequest({
    ObjectRef? object,
    $core.List<$core.int>? content,
    $core.String? mimeType,
    $core.bool? upsert,
  }) {
    final result = create();
    if (object != null) result.object = object;
    if (content != null) result.content = content;
    if (mimeType != null) result.mimeType = mimeType;
    if (upsert != null) result.upsert = upsert;
    return result;
  }

  UploadRequest._();

  factory UploadRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UploadRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UploadRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOM<ObjectRef>(1, _omitFieldNames ? '' : 'object',
        subBuilder: ObjectRef.create)
    ..a<$core.List<$core.int>>(
        2, _omitFieldNames ? '' : 'content', $pb.PbFieldType.OY)
    ..aOS(3, _omitFieldNames ? '' : 'mimeType')
    ..aOB(4, _omitFieldNames ? '' : 'upsert')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UploadRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UploadRequest copyWith(void Function(UploadRequest) updates) =>
      super.copyWith((message) => updates(message as UploadRequest))
          as UploadRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UploadRequest create() => UploadRequest._();
  @$core.override
  UploadRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UploadRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UploadRequest>(create);
  static UploadRequest? _defaultInstance;

  @$pb.TagNumber(1)
  ObjectRef get object => $_getN(0);
  @$pb.TagNumber(1)
  set object(ObjectRef value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasObject() => $_has(0);
  @$pb.TagNumber(1)
  void clearObject() => $_clearField(1);
  @$pb.TagNumber(1)
  ObjectRef ensureObject() => $_ensure(0);

  @$pb.TagNumber(2)
  $core.List<$core.int> get content => $_getN(1);
  @$pb.TagNumber(2)
  set content($core.List<$core.int> value) => $_setBytes(1, value);
  @$pb.TagNumber(2)
  $core.bool hasContent() => $_has(1);
  @$pb.TagNumber(2)
  void clearContent() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get mimeType => $_getSZ(2);
  @$pb.TagNumber(3)
  set mimeType($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasMimeType() => $_has(2);
  @$pb.TagNumber(3)
  void clearMimeType() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.bool get upsert => $_getBF(3);
  @$pb.TagNumber(4)
  set upsert($core.bool value) => $_setBool(3, value);
  @$pb.TagNumber(4)
  $core.bool hasUpsert() => $_has(3);
  @$pb.TagNumber(4)
  void clearUpsert() => $_clearField(4);
}

class UploadResult extends $pb.GeneratedMessage {
  factory UploadResult({
    $core.String? path,
    $0.Size? size,
    $0.Failure? error,
  }) {
    final result = create();
    if (path != null) result.path = path;
    if (size != null) result.size = size;
    if (error != null) result.error = error;
    return result;
  }

  UploadResult._();

  factory UploadResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UploadResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UploadResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'path')
    ..aOM<$0.Size>(2, _omitFieldNames ? '' : 'size', subBuilder: $0.Size.create)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UploadResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UploadResult copyWith(void Function(UploadResult) updates) =>
      super.copyWith((message) => updates(message as UploadResult))
          as UploadResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UploadResult create() => UploadResult._();
  @$core.override
  UploadResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UploadResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UploadResult>(create);
  static UploadResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get path => $_getSZ(0);
  @$pb.TagNumber(1)
  set path($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasPath() => $_has(0);
  @$pb.TagNumber(1)
  void clearPath() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Size get size => $_getN(1);
  @$pb.TagNumber(2)
  set size($0.Size value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasSize() => $_has(1);
  @$pb.TagNumber(2)
  void clearSize() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Size ensureSize() => $_ensure(1);

  @$pb.TagNumber(3)
  $0.Failure get error => $_getN(2);
  @$pb.TagNumber(3)
  set error($0.Failure value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(3)
  void clearError() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Failure ensureError() => $_ensure(2);
}

class DeleteRequest extends $pb.GeneratedMessage {
  factory DeleteRequest({
    $core.Iterable<ObjectRef>? objects,
  }) {
    final result = create();
    if (objects != null) result.objects.addAll(objects);
    return result;
  }

  DeleteRequest._();

  factory DeleteRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..pPM<ObjectRef>(1, _omitFieldNames ? '' : 'objects',
        subBuilder: ObjectRef.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest copyWith(void Function(DeleteRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteRequest))
          as DeleteRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteRequest create() => DeleteRequest._();
  @$core.override
  DeleteRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteRequest>(create);
  static DeleteRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<ObjectRef> get objects => $_getList(0);
}

class DeleteResult extends $pb.GeneratedMessage {
  factory DeleteResult({
    $core.int? deleted,
    $0.Failure? error,
  }) {
    final result = create();
    if (deleted != null) result.deleted = deleted;
    if (error != null) result.error = error;
    return result;
  }

  DeleteResult._();

  factory DeleteResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'deleted', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult copyWith(void Function(DeleteResult) updates) =>
      super.copyWith((message) => updates(message as DeleteResult))
          as DeleteResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteResult create() => DeleteResult._();
  @$core.override
  DeleteResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteResult>(create);
  static DeleteResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get deleted => $_getIZ(0);
  @$pb.TagNumber(1)
  set deleted($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasDeleted() => $_has(0);
  @$pb.TagNumber(1)
  void clearDeleted() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class SignedUrlRequest extends $pb.GeneratedMessage {
  factory SignedUrlRequest({
    ObjectRef? object,
    $0.Time? expiresIn,
  }) {
    final result = create();
    if (object != null) result.object = object;
    if (expiresIn != null) result.expiresIn = expiresIn;
    return result;
  }

  SignedUrlRequest._();

  factory SignedUrlRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SignedUrlRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SignedUrlRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOM<ObjectRef>(1, _omitFieldNames ? '' : 'object',
        subBuilder: ObjectRef.create)
    ..aOM<$0.Time>(2, _omitFieldNames ? '' : 'expiresIn',
        subBuilder: $0.Time.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignedUrlRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignedUrlRequest copyWith(void Function(SignedUrlRequest) updates) =>
      super.copyWith((message) => updates(message as SignedUrlRequest))
          as SignedUrlRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SignedUrlRequest create() => SignedUrlRequest._();
  @$core.override
  SignedUrlRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SignedUrlRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SignedUrlRequest>(create);
  static SignedUrlRequest? _defaultInstance;

  @$pb.TagNumber(1)
  ObjectRef get object => $_getN(0);
  @$pb.TagNumber(1)
  set object(ObjectRef value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasObject() => $_has(0);
  @$pb.TagNumber(1)
  void clearObject() => $_clearField(1);
  @$pb.TagNumber(1)
  ObjectRef ensureObject() => $_ensure(0);

  @$pb.TagNumber(2)
  $0.Time get expiresIn => $_getN(1);
  @$pb.TagNumber(2)
  set expiresIn($0.Time value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasExpiresIn() => $_has(1);
  @$pb.TagNumber(2)
  void clearExpiresIn() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Time ensureExpiresIn() => $_ensure(1);
}

class SignedUrlResult extends $pb.GeneratedMessage {
  factory SignedUrlResult({
    $core.String? url,
    $0.Failure? error,
  }) {
    final result = create();
    if (url != null) result.url = url;
    if (error != null) result.error = error;
    return result;
  }

  SignedUrlResult._();

  factory SignedUrlResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SignedUrlResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SignedUrlResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'url')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignedUrlResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignedUrlResult copyWith(void Function(SignedUrlResult) updates) =>
      super.copyWith((message) => updates(message as SignedUrlResult))
          as SignedUrlResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SignedUrlResult create() => SignedUrlResult._();
  @$core.override
  SignedUrlResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SignedUrlResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SignedUrlResult>(create);
  static SignedUrlResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get url => $_getSZ(0);
  @$pb.TagNumber(1)
  set url($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUrl() => $_has(0);
  @$pb.TagNumber(1)
  void clearUrl() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class ListRequest extends $pb.GeneratedMessage {
  factory ListRequest({
    $core.String? folder,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? pathArgs,
    $core.int? limit,
    $core.int? offset,
  }) {
    final result = create();
    if (folder != null) result.folder = folder;
    if (pathArgs != null) result.pathArgs.addEntries(pathArgs);
    if (limit != null) result.limit = limit;
    if (offset != null) result.offset = offset;
    return result;
  }

  ListRequest._();

  factory ListRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ListRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ListRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'folder')
    ..m<$core.String, $core.String>(2, _omitFieldNames ? '' : 'pathArgs',
        entryClassName: 'ListRequest.PathArgsEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.clients.storage.v1'))
    ..aI(3, _omitFieldNames ? '' : 'limit', fieldType: $pb.PbFieldType.OU3)
    ..aI(4, _omitFieldNames ? '' : 'offset', fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListRequest copyWith(void Function(ListRequest) updates) =>
      super.copyWith((message) => updates(message as ListRequest))
          as ListRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ListRequest create() => ListRequest._();
  @$core.override
  ListRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ListRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ListRequest>(create);
  static ListRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get folder => $_getSZ(0);
  @$pb.TagNumber(1)
  set folder($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasFolder() => $_has(0);
  @$pb.TagNumber(1)
  void clearFolder() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbMap<$core.String, $core.String> get pathArgs => $_getMap(1);

  @$pb.TagNumber(3)
  $core.int get limit => $_getIZ(2);
  @$pb.TagNumber(3)
  set limit($core.int value) => $_setUnsignedInt32(2, value);
  @$pb.TagNumber(3)
  $core.bool hasLimit() => $_has(2);
  @$pb.TagNumber(3)
  void clearLimit() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.int get offset => $_getIZ(3);
  @$pb.TagNumber(4)
  set offset($core.int value) => $_setUnsignedInt32(3, value);
  @$pb.TagNumber(4)
  $core.bool hasOffset() => $_has(3);
  @$pb.TagNumber(4)
  void clearOffset() => $_clearField(4);
}

class ObjectSummary extends $pb.GeneratedMessage {
  factory ObjectSummary({
    $core.String? path,
    $0.Size? size,
    $core.String? mimeType,
    $fixnum.Int64? updatedAt,
  }) {
    final result = create();
    if (path != null) result.path = path;
    if (size != null) result.size = size;
    if (mimeType != null) result.mimeType = mimeType;
    if (updatedAt != null) result.updatedAt = updatedAt;
    return result;
  }

  ObjectSummary._();

  factory ObjectSummary.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ObjectSummary.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ObjectSummary',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'path')
    ..aOM<$0.Size>(2, _omitFieldNames ? '' : 'size', subBuilder: $0.Size.create)
    ..aOS(3, _omitFieldNames ? '' : 'mimeType')
    ..aInt64(4, _omitFieldNames ? '' : 'updatedAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ObjectSummary clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ObjectSummary copyWith(void Function(ObjectSummary) updates) =>
      super.copyWith((message) => updates(message as ObjectSummary))
          as ObjectSummary;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ObjectSummary create() => ObjectSummary._();
  @$core.override
  ObjectSummary createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ObjectSummary getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ObjectSummary>(create);
  static ObjectSummary? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get path => $_getSZ(0);
  @$pb.TagNumber(1)
  set path($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasPath() => $_has(0);
  @$pb.TagNumber(1)
  void clearPath() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Size get size => $_getN(1);
  @$pb.TagNumber(2)
  set size($0.Size value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasSize() => $_has(1);
  @$pb.TagNumber(2)
  void clearSize() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Size ensureSize() => $_ensure(1);

  @$pb.TagNumber(3)
  $core.String get mimeType => $_getSZ(2);
  @$pb.TagNumber(3)
  set mimeType($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasMimeType() => $_has(2);
  @$pb.TagNumber(3)
  void clearMimeType() => $_clearField(3);

  @$pb.TagNumber(4)
  $fixnum.Int64 get updatedAt => $_getI64(3);
  @$pb.TagNumber(4)
  set updatedAt($fixnum.Int64 value) => $_setInt64(3, value);
  @$pb.TagNumber(4)
  $core.bool hasUpdatedAt() => $_has(3);
  @$pb.TagNumber(4)
  void clearUpdatedAt() => $_clearField(4);
}

class ListResult extends $pb.GeneratedMessage {
  factory ListResult({
    $core.Iterable<ObjectSummary>? objects,
    $0.Failure? error,
  }) {
    final result = create();
    if (objects != null) result.objects.addAll(objects);
    if (error != null) result.error = error;
    return result;
  }

  ListResult._();

  factory ListResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ListResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ListResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.storage.v1'),
      createEmptyInstance: create)
    ..pPM<ObjectSummary>(1, _omitFieldNames ? '' : 'objects',
        subBuilder: ObjectSummary.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListResult copyWith(void Function(ListResult) updates) =>
      super.copyWith((message) => updates(message as ListResult)) as ListResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ListResult create() => ListResult._();
  @$core.override
  ListResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ListResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ListResult>(create);
  static ListResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<ObjectSummary> get objects => $_getList(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class StorageApi {
  final $pb.RpcClient _client;

  StorageApi(this._client);

  $async.Future<UploadResult> upload(
          $pb.ClientContext? ctx, UploadRequest request) =>
      _client.invoke<UploadResult>(
          ctx, 'Storage', 'Upload', request, UploadResult());
  $async.Future<DeleteResult> delete(
          $pb.ClientContext? ctx, DeleteRequest request) =>
      _client.invoke<DeleteResult>(
          ctx, 'Storage', 'Delete', request, DeleteResult());
  $async.Future<SignedUrlResult> signedUrl(
          $pb.ClientContext? ctx, SignedUrlRequest request) =>
      _client.invoke<SignedUrlResult>(
          ctx, 'Storage', 'SignedUrl', request, SignedUrlResult());
  $async.Future<ListResult> list($pb.ClientContext? ctx, ListRequest request) =>
      _client.invoke<ListResult>(ctx, 'Storage', 'List', request, ListResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
