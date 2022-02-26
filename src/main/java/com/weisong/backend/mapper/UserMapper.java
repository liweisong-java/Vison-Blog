package com.weisong.backend.mapper;
import org.apache.ibatis.annotations.*;
import com.weisong.backend.entities.User;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;


/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
@Repository
public interface UserMapper {

    //    注册/添加User
    @Insert("insert into user(uuid,name,email,gender,birth) values(#{uuid},#{name},#{email},#{gender},#{birth})")
    void insertEmp(@Param("uuid")String uuid,@Param("name")String name, @Param("email")String email , @Param("gender")Integer gender, @Param("birth")Date birth);

    //    通过UUId 注销/删除User
    @Delete("delete from user where uuid=#{uuid}")
    void deleteUserById(@Param("uuid") String uuid);

    //      检查User的name合法
//    @Select("SELECT name,COUNT(name) from user GROUP BY name HAVING COUNT(name) > 1")
//    List<User> checkUser(String name);

}
